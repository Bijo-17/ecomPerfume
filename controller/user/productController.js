const Category = require("../../models/categorySchema")
const Product = require("../../models/productSchema")
const Rating = require("../../models/ratingSchema")
const User = require("../../models/userSchema")



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
         
        const {  price  } = req.query;

        console.log('req.query', req.query);

        console.log("sort Query", sortOption)    
    
        const filter = { isDeleted: false ,isBlocked:false, stock_status:true };

      if (categoryName) {
         const catDoc = await Category.findOne({ name:categoryName });
         if (catDoc) filter.category_id = catDoc._id;
    }
        if (price) {
    if (price === "2000+") {
      filter.sales_price = { $gte: 2000 };
    } else {
      const [min, max] = price.split("-").map(Number);
      filter.sales_price = { $gte: min, $lte: max };
    }
  }
         
     let sortQuery = {}

    //  sortOption = 'nameAZ'

    switch (sortOption) {
      case 'priceLow':
        sortQuery = { sales_price: 1 }; // ascending
        break;
      case 'priceHigh':
        sortQuery = { sales_price: -1 }; // descending
        console.log("entered priceHigh",sortQuery)
        break;
      case 'nameAZ':
        sortQuery = { product_name: 1 }; // A-Z
        console.log("asc entered",sortQuery)
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
        
        console.log("count",count)

        const ratings = await Rating.find()

         return res.render("allProductPage",{products  , 
                                            categories , 
                                            sort:sortOption, 
                                            price , 
                                            categoryName , 
                                            currentPage:page,
                                           totalPages:Math.ceil(count/limit),
                                            ratings,
                                          user:userData })


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

        if(user){
          userData = await User.findOne({_id:user});
        }

    const ratings = await Rating.find({product_id:productId}).populate('user_id')

    const product = await Product.findOne({_id:productId  }).populate('brand_id category_id')

    console.log("product started.........\n",product , "product ended ......");
    
    let product_status;

  
  if (product.stock_status === false) {
            product_status = 'Out of stock';
      } else if (product.isBlocked === true) {
            product_status = 'Unavailable';
      } else {
          product_status = '';
      }
   
    console.log("product_status",product_status)

     const relatedProducts = await Product.find({
          category_id: product.category_id._id,
          _id: { $ne: product._id },
           isDeleted: false,
           stock_status:true,
           isBlocked:false
         }).limit(4).populate('brand_id');

     

     res.render("productDetails",{product, relatedProducts , product_status , ratings, averageRating:product.averageRating ,user:userData})

} catch(error){
    console.log("failed to load productDetail page",error);
    res.redirect("/pageNotFound")
}

}

const renderEditPage = async (req, res) => {
  const products = await Product.find()
   res.render("allProductPage", {
      products,
    breadcrumbs: req.breadcrumbs, // <<--- This line is required
  });
};

const rateProduct =async (req,res)=>{

  const { rating, review } = req.body;
  const userId = req.session.user;
  const { productId } = req.params;

  console.log("productId",productId)
  console.log("userId",userId)
   
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

  console.log("ratings",ratings)
  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  console.log("averagerating",average)

  await Product.findByIdAndUpdate(productId, { averageRating: average , ratingCount:ratingCount  });

  res.redirect(`/productDetails/${productId}`);
};

}




module.exports =  { getAllProducts , productDetails , renderEditPage , rateProduct}