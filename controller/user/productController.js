const Category = require("../../models/categorySchema")
const Product = require("../../models/productSchema")
const Rating = require("../../models/ratingSchema")
const User = require("../../models/userSchema")
const Subcategory = require("../../models/subCategorySchema")
const Brand = require("../../models/brandSchema")
const Varients = require("../../models/varientsSchema")



const getAllProducts = async (req,res)=>{
    try {

        const categoryName = req.params.category || '';
        const page = parseInt(req.query.page) || 1;
        let sortOption = req.query.sort;
         const {  price  } = req.query;
        const user = req.session.user;
        const sub = req.query.sub || '';
        let userData = ''
        if(user){
           userData = await User.findOne({_id:user});
        }
    
        let search = "";
       const filter = { isDeleted:false , isBlocked: false  };
        
        if(categoryName.includes("Search")){
        
              search = categoryName.split("=")[1]?.trim() || ""; 
      
              const brand = await Brand.find({name:{$regex: search , $options: 'i'}})
        const brandId = brand.map(i=> i._id)
        const category = await Category.find({name: {$regex: search , $options : 'i'}})
         const catId = category.map(c=> c._id)
        const subcategory = await Subcategory.find({name: {$regex: search , $options : 'i'}})
         const subcatId = category.map(c=> c._id)
         
        filter.$or = [
            { product_name : { $regex : search , $options : 'i'}},
            { brand_id :{  $in : brandId} },
             { category_id :{  $in : catId} },
              { subcategory_id :{  $in : subcatId} }
        ]
        }
 
  let subcategoryProducts;

      if (categoryName) {
         const catDoc = await Category.findOne({ name:categoryName });

         if (catDoc){

           filter.category_id = catDoc._id; 

             if(sub){
                const subdoc = await Subcategory.findOne({name:sub , category_id : catDoc._id})
                if(subdoc) filter.subcategory_id = subdoc;
        
             }
          
          }
          

            if(!catDoc){ 

                const subDoc = await Subcategory.find({name:categoryName})
              
                if(subDoc && subDoc.length>0){
              
                   subcategoryProducts = [];
                   for(let s of subDoc){
                          const subProducts = await Product.find({subcategory_id: s._id , isDeleted:false , isBlocked: false}).populate('brand_id varients_id')
                        subcategoryProducts.push(subProducts)
                           
                      }

                   }
                               
                
                if(!catDoc && subDoc.length<1){
               
                    const brandDoc = await Brand.findOne({name:{$regex : categoryName , $options : 'i' }});
                    if(brandDoc) filter.brand_id = brandDoc._id
                  }

              }
           
          } 
          


    if (price) {
       if (price === "2000+") {
         filter.final_price = { $gte: 2000 };
       } else {
         const [min, max] = price.split("-").map(Number);
         filter.final_price = { $gte: min, $lte: max };
       }
   }
         
     let sortQuery = {}

    //  sortOption = 'nameAZ'

    switch (sortOption) {
      case 'priceLow':
        sortQuery = { final_price: 1 }; // ascending
        break;
      case 'priceHigh':
        sortQuery = { final_price: -1 }; // descending
     
        break;
      case 'nameAZ':
        sortQuery = { product_name: 1 }; // A-Z
    
        break;
      case 'nameZA':
        sortQuery = { product_name: -1 }; // Z-A
        break;
      default:
        sortQuery = {createdAt: -1}; // no sorting
    }
     
    const categories = await Category.find({isDeleted:false , status: 'active'});

    const subcategory = await Subcategory.find({isDeleted:false , status: 'active'});

      categories.forEach(category=> {
            category.subcategories = subcategory.filter(s=> s.category_id.toString() === category._id.toString())
      })

    const limit = 9;
    const skip = (page - 1) * limit;

    let displayProducts;
  
    if(!subcategoryProducts){ 
    
         const products = await Product.find(filter)
         .collation({ locale: 'en', strength: 2 })
         .sort(sortQuery)
         .populate('brand_id category_id varients_id')
         .exec();
    
         displayProducts = products.filter(p=> p.brand_id?.status === 'active' && p.category_id?.status === 'active')

    }
         
         if(subcategoryProducts){

            displayProducts = subcategoryProducts.flat();

             switch(sortOption){

                case 'priceLow':  {
                                      displayProducts.sort((a,b)=> a.final_price - b.final_price);
                                      break;
                                  }
                case 'priceHigh': {
                                      displayProducts.sort((a,b)=> b.final_price - a.final_price);
                                      break;
                                  }  
                case 'nameAZ' :   {
                                      displayProducts.sort((a,b)=> a.product_name.localeCompare(b.product_name , 'en' ,{sensitivity:'base'} ) );
                                      break;
                                  }  
                 case 'nameZA' :  {
                                       displayProducts.sort((a,b)=> b.product_name.localeCompare(a.product_name , 'en', {sensitivity: 'base'} ));
                                       break;
                                  }                                         
               }

                if(price){
                       
                            if(price === '2000+'){ 
                               displayProducts =  displayProducts.filter(p=> p.final_price >= 2000); 
                            } else {
                                const [min , max] = price.split('-').map(Number)
                                displayProducts = displayProducts.filter(p=> p.final_price >= min && p.final_price <=max);
                            }
                                                           
                                          
                       }
                

         }


         // remove out of stock products


       displayProducts = displayProducts.filter(product => {
            
                                        return !product.varients_id.inventory.every(s=> s.stock < 1);
                               })
         
              
        
         const count = displayProducts.length;
         
         const paginatedProducts = displayProducts.slice(skip, skip + limit);

        const ratings = await Rating.find()

         return res.render("allProductPage",{products: paginatedProducts  , 
                                            categories , 
                                            sort:sortOption, 
                                            price , 
                                            categoryName , 
                                            currentPage:page,
                                            totalPages:Math.ceil(count/limit),
                                            ratings,
                                            user:userData,
                                            search,
                                            sub   
                                        })


    } catch (error) {
        console.log("unable to load products",error);
        res.redirect("/pageNotFound");
    }
}


const productDetails = async (req,res)=>{

    try { 
    const productId = req.params.id;
    const user = req.session.user
     let userData = ''
     let selectedVolume = req.query.volume || '';

        if(user){
          userData = await User.findOne({_id:user});
        }

        const product = await Product.findOne({_id:productId  }).populate('brand_id category_id')

        const varients = await Varients.findOne({product_id:productId});

        let regular_price = product.regular_price;
        let sales_price = product.final_price;

        let stock_status = '';

        if(selectedVolume && varients){

            const varientData = varients.inventory.find(d=> d.volume === parseInt(selectedVolume))
         
             regular_price = varientData.regular_price;
             sales_price = varientData.final_price;

            if(varientData.stock < 1){
               stock_status = "Out of stock"
            }
        }

        if(!selectedVolume){

            selectedVolume = varients.inventory[0].volume;  
            regular_price = varients.inventory[0].regular_price;
            sales_price = varients.inventory[0].final_price;

            if(varients.inventory[0].stock < 1){
               stock_status = "Out of stock"
            }
        }
        

    const ratings = await Rating.find({product_id:productId}).populate('user_id')

    let product_status = '';

      if(stock_status){
         product_status = stock_status;
      }
  
    if (product.isBlocked === true ||  
             (product.brand_id.status === 'block' && product.brand_id.isDeleted === false) || 
             (product.category_id.status === 'blocked' && product.category_id.isDeleted === false) 
        ) {
            product_status = 'Unavailable';
      } 

     const relatedProducts = await Product.find({
          category_id: product.category_id._id,
          _id: { $ne: product._id },
           isDeleted: false,
           stock_status:true,
           isBlocked:false
         }).limit(4).populate('brand_id');

     

     res.render("productDetails",{product, relatedProducts, regular_price , sales_price, volume:selectedVolume , product_status , ratings, averageRating:product.averageRating ,user:userData})

} catch(error){
    console.log("failed to load productDetail page",error);
    res.redirect("/pageError");
}

}



const rateProduct =async (req,res)=>{

  const { rating, review } = req.body;
  const userId = req.session.user;
  const { productId } = req.params;
 
  if(!userId){
    res.redirect(`/login`)
  } else{

  const product = await Product.findById(productId);

  let existingRating = await Rating.findOne({ user_id: userId, product_id: productId });

  let ratingCount = product.ratingCount


  if (existingRating) {
    existingRating.rating = rating;
    existingRating.review = review;
    await existingRating.save();
  } else {
    await Rating.create({ user_id: userId, product_id: productId, rating, review });
     ratingCount++;
  }
  
  const ratings = await Rating.find({ product_id: productId });

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await Product.findByIdAndUpdate(productId, { averageRating: average , ratingCount:ratingCount  });

  res.redirect(`/productDetails/${productId}`);
};

}

const editRating = async (req,res)=>{
   try {
     
         const userId = req.session.user;
         const {updatedReview , updatedRating} = req.body;
         const productId = req.params.productId;  
         const existingRating = await Rating.findOne({user_id : userId , product_id : productId});

         if(existingRating){

             existingRating.rating = updatedRating;
             existingRating.review = updatedReview;
             await existingRating.save();

             const ratings = await Rating.find({ product_id: productId }); 
             const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
             await Product.findByIdAndUpdate(productId, { averageRating: average });
          
           
         }

             return res.status(200).json({success:true});

     
   } catch (error) {
      console.log("error in editing rating" , error)
      res.status(500).redirect('/pageError');
   }
}

const deleteRating = async (req,res)=>{
   try {

    const ratingId = req.params.reviewId;

   const rating = await Rating.findByIdAndDelete(ratingId);

   const ratings = await Rating.find({product_id : rating.product_id});
     
    const product = await Product.findOne({_id: rating.product_id });

    const ratingCount = (product.ratingCount)-1;

      let average = ratings.reduce((sum, r) => sum + r.rating, 0);
 
       average =  (average/ ratings.length) || 0 ;

      await Product.findByIdAndUpdate(product._id,{ averageRating : average , ratingCount : ratingCount});

       res.status(200).json({success: true});
    
   } catch (error) {
      console.log("error in deleting review" , error);
      res.status(500).redirect("/pageError");
   }
}


module.exports =  { getAllProducts , productDetails , rateProduct , editRating , deleteRating}