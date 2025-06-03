
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")
const Brand = require("../../models/brandSchema")
const User = require("../../models/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const addProductPage = async (req,res)=>{
    try {
        
        const category = await Category.find({status: 'active'})
            
        const subcategory = await Subcategory.find({status:'active'}).populate('category_id')
        const brand = await Brand.find({status:'active'})
       

        res.render("addProduct",{
            cat:category,   
            subcat:subcategory,
            brand
        })


    } catch (error) {
        res.redirect("/admin/pageError")
        console.error("unable to add product ",error)
        
    }
}

const addProducts = async (req,res)=>{
    try {
        
        const product = req.body;
        console.log("product details......\n" , product , "\n last .......")
        const productExists = await Product.findOne({
            product_name:product.productName,

        });

          if(!productExists){
            const images = [];



            if (req.files && req.files.length > 0) {
                     for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
       
                     images.push('/uploads/images/' + req.files[i].filename);
                 }
            }


            const category = await Category.findOne({_id:product.categoryId});

            const subcategory = await Subcategory.findOne({name:product.subcategory});

            const brand = await Brand.findOne({name:product.brand})
               
            if(!category){
                return res.status(400).json("Invalid category name")
            }

            console.log(product)

            const newProduct = new Product({

                product_name:product.productName,
                         category_id: category._id,
                                       
                           subcategory_id: subcategory ? subcategory._id:null,
                           brand_id:brand._id,
                               isBlocked:false,      
                           description: product.description ,
                             stock:   product.quantity,
                             
                           stock_status:true,
                            regular_price: product.regularPrice,
                            sales_price:product.salesPrice,
                                 image: images,
                                volume: product.volume

            })

            await newProduct.save();
            return res.redirect("/admin/addProduct")

          }else {
            return res.status(400).json({sucess:false});
          }


    } catch (error) {
        console.log("error saving the product",error)
        res.redirect("/admin/pageError")
    }
}

const listProducts =async (req,res)=>{
  try {

    const search = String(req.query.search || '').trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
  
   
     const filter = { isDeleted: false };

      if (search) {

          const brand = await Brand.find({ name: { $regex: search, $options: "i" } });
          const brandId = brand.map(b => b._id);
         

          filter.$or = [
          { product_name: { $regex: new RegExp(search, "i") } },
          { brand_id: { $in: brandId } }
  ];
}
     
  

              // {product_name:{$regex:new RegExp(".*"+search+".*","i") }},
      
    
  
    
       const productData = await Product.find(filter)
        .sort({createdAt:-1})
        .limit(limit)   
        .skip((page-1)*limit)
        .populate('category_id')
        .populate('subcategory_id')
        .populate('brand_id')
        .exec();

       const count = await Product.countDocuments(filter)

       const category = await Category.find({isDeleted:false});

       const subcategory = await Subcategory.find({isDeleted:false})

       const brand = await Brand.find({isDeleted:false})

      //  console.log("productData",productData)

    if(category ){
        res.render("products",{
            data:productData,
            cat:category ,
            subcat: subcategory,
            brand,
            currentPage:page,
            totalPages:Math.ceil(count/limit),
            cat:category,
            subc: subcategory? subcategory: "",
            search,
         
            
        })
    } else{
        res.render("pageNotFound")  
    }

    
  } catch (error) {
    res.redirect("/admin/pageError")
    console.log(error)
  }
   
}

const blockProduct = async (req,res)=>{

   try{

  const {id,page} = req.params;

    // await Product.findByIdAndUpdate(productId , { isDeleted:true })

    await Product.updateOne({_id:id }, {$set:{ isBlocked:true }});

  return res.redirect(`/admin/products?page=${page}`);

   }
   
   catch(error){
    console.log("error in blocking product",error)
    res.redirect("/admin/pageError")
   }


}

const unblockProduct = async (req,res)=>{
  
   try{

  const {id,page} = req.params;
  
  const product = await Product.findByIdAndUpdate(id ,{ isBlocked:false})

  return res.redirect(`/admin/products?page=${page}`);

   }
   
   catch(error){
    console.log("error in blocking product",error)
    res.redirect("/admin/pageError")
   }


}

const deleteProduct = async (req,res)=>{
  try {
      
    const productId = req.params.id;
    const currentPage = req.params.page
  
  
  const product = await Product.findByIdAndUpdate(productId ,{ isDeleted:true});

  return res.redirect(`/admin/products?page=${currentPage}`);



  } catch (error) {
    console.log("error in deleting product",error)
    res.redirect("/admin/pageError")
  }
}

const addOffer = async (req,res)=>{
    try {
      const productId = req.params.id;
    
      const {offer} = req.body
     


      const updateOffer = await Product.findByIdAndUpdate(productId,{offer_price:offer});

     return res.status(200).json({ message: 'Offer added successfully' });

    } catch (error) {
       console.log("error in adding offer ", error)
       res.redirect("/admin/pageError")
    }
}

const removeOffer = async (req,res)=>{
    try {
      const productId = req.params.id;
      const currentPage = req.params.page;
    
    console.log(productId)

      const updateOffer = await Product.findByIdAndUpdate(productId,{offer_price:0});

     return res.status(200).json({ message: 'Offer added successfully' });

    } catch (error) {
        console.error('Error adding offer:', error);
    res.status(500).json({ message: 'Server error' });
    }
}


const editProduct = async (req,res)=>{
  try {
    const editedDetails = req.body;
    const productId = req.params.id;
   console.log("editedDetails",editedDetails)
   console.log("id",productId)
   console.log("req.files",req.files)
   
   const existing = await Product.findById(productId);
 
    console.log('existing.product',existing.regular_price)

    console.log('editedDetails.product',editedDetails.regular_price)

   console.log("existing product",typeof existing)

      const updatedFields = {};
 




     for (let key in editedDetails) {
      console.log("existing[key]",existing[key])
      if (editedDetails[key] && editedDetails[key] !== JSON.stringify(existing[key])) {
        console.log("editedDetails", editedDetails[key], "existing detail", existing[key] )
        updatedFields[key] =  editedDetails[key];
        console.log("updated",existing[key])
      }
    }

        if (req.files && req.files.length > 0) {
      const images = existing.image;
      for (let i = 0; i < req.files.length; i++) {
        const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
        await sharp(req.files[i].path)
          .resize({ width: 440, height: 440 })
          .toFile(resizedImagePath);
        images.push('/uploads/images/' + req.files[i].filename);
      }
      updatedFields.image = images;
    }
 
    const updatedProduct = await Product.findByIdAndUpdate(productId, updatedFields, { new: true });


    res.redirect('/admin/products')


  } catch (error) {
     console.error('Error editing product:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const renderEditPage = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('brand_id');
  res.render('admin/editProduct', {
    data: product,
    breadcrumbs: req.breadcrumbs, // <<--- This line is required
  });
};





module.exports = {
   addProductPage,
   addProducts,
   listProducts,
   blockProduct,
   unblockProduct,
   deleteProduct,
   addOffer,
   removeOffer,
   editProduct,
   renderEditPage
   

}

