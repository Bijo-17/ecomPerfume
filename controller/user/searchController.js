
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema")
const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")
const Rating = require("../../models/ratingSchema")


const search = async (req,res)=>{
    try {
       
      console.log("called")
          const search = String(req.query.q || '').trim();
          const page = parseInt(req.query.page) || 1
          const {price ,sortOption }= req.query
         

        const filter = {isDeleted:false , isBlocked:false , stock_status :true }
        

     if(search){
           
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
        const categoryName = 'Search = ' + search

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
             
          
        
            const limit = 9;
            const skip = (page - 1) * limit;

        const products = await Product.find(filter).sort(sortQuery).limit(limit).skip(skip).populate([{ path:'brand_id', select: 'name' }, {path:'category_id', select: 'name'}  ])

        console.log("producst" , products)

          const count = await Product.countDocuments(filter);

          const ratings = await Rating.find()

        res.render("allProductPage",{ products, categoryName, search , sort:sortOption , price ,currentPage:page , totalPages: Math.ceil(count/limit) , ratings })


    } catch (error) {
        console.log("error in seaching items" , error)
    }
}



module.exports ={  search }