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
        const user = req.session.user;
        let userData = ''
        if(user){
           userData = await User.findOne({_id:user});
        }

        let search = "";
       const filter = { isDeleted: false ,isBlocked:false, stock_status:true };
        
       filter.stock = { $gt: 0 }
   
        if(categoryName.includes("Search")){
           console.log("entered search" ,  categoryName)
              search = categoryName.split("=")[1]?.trim() || ""; 
           console.log(search , "search")
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
 
        const {  price  } = req.query;
         
    

      if (categoryName) {
         const catDoc = await Category.findOne({ name:categoryName });
         if (catDoc) filter.category_id = catDoc._id;
         if(!catDoc){ 
                const subDoc = await Subcategory.findOne({name:categoryName})
                if(subDoc)  filter.subcategory_id = subDoc
             
         } 
    }

    const sub = await Subcategory.find({name:'Bath and body'})
 

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
     
    const categories = await Category.find({isDeleted:false});

    const limit = 9;
    const skip = (page - 1) * limit;

         const products = await Product.find(filter)
         .collation({ locale: 'en', strength: 2 })
         .sort(sortQuery)
         .limit(limit)
         .skip(skip)
         .populate('brand_id category_id')
         .exec()
         
        const count = await Product.countDocuments(filter);
        

        const ratings = await Rating.find()

         return res.render("allProductPage",{products  , 
                                            categories , 
                                            sort:sortOption, 
                                            price , 
                                            categoryName , 
                                            currentPage:page,
                                           totalPages:Math.ceil(count/limit),
                                            ratings,
                                          user:userData,
                                          search   })


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

     console.log("selected Volume" , selectedVolume)

        if(user){
          userData = await User.findOne({_id:user});
        }

        const product = await Product.findOne({_id:productId  }).populate('brand_id category_id')

        const varients = await Varients.findOne({product_id:productId});

        console.log("vaienddts" , varients)

        let regular_price = product.regular_price;
        let sales_price = product.final_price;

        if(product.offer_price >  sales_price){
           sales_price = product.offer_price;
        }

        let stock_status = '';

        if(selectedVolume && varients){
            varientData = varients.inventory.find(d=> d.volume === parseInt(selectedVolume))
            console.log("v" , varientData)
            regular_price = varientData.regular_price;
            sales_price = varientData.final_price;
            if(varientData.offer_price > sales_price){
               sales_price = varientData.offer_price;
            }

            if(varientData.stock < 1){
               stock_status = "Out of stock"
            }
        }

        if(!selectedVolume){
           selectedVolume = product?.volume[0] ? product.volume[0] : product.volume
        }
        
    console.log("volume raea" , selectedVolume)
        
        console.log("price"  , regular_price , sales_price)


    const ratings = await Rating.find({product_id:productId}).populate('user_id')

    

    
    let product_status;

  
    if (product.isBlocked === true) {
            product_status = 'Unavailable';
      } else {
          product_status = '';
      }

      if(stock_status){
         product_status = stock_status;
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
    res.redirect("/pageNotFound")
}

}



const rateProduct =async (req,res)=>{

  const { rating, review } = req.body;
  const userId = req.session.user;
  const { productId } = req.params;

 
   
  if(!userId){
    res.redirect(`/productDetails/${productId}`)
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





module.exports =  { getAllProducts , productDetails , rateProduct}