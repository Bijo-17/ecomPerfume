
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")
const User = require("../../models/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const addProductPage = async (req,res)=>{
    try {
        
        const category = await Category.find({status: 'active'})
            
        const subcategory = await Subcategory.find({status:'active'})

        res.render("addProduct",{
            cat:category,   
            subcat:subcategory
        })


    } catch (error) {
        res.redirect("/pageError")
        console.error("unable to add product ",error)
        
    }
}

const addProducts = async (req,res)=>{
    try {
        
        const products = req.body;
        const productExists = await Product.findOne({
            product_name:products.productName,

        });

          if(!productExists){
            const images = [];



            if (req.files && req.files.length > 0) {
                     for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
       
                     images.push('/uploads/product-images/' + req.files[i].filename);
                 }
            }


            const categoryId = await Category.findOne({name:products.category});

            const subcategoryId = await Subategory.findOne({name:products.subcategory});
               
            if(!categoryId){
                return res.status(400).json("Invalid category name")
            }

            const newProduct = new Product({

                product_name:products.productname,
                         category_id: categoryId._id,
                                       
                           subcategory_id: subcategoryId._id,
                                    
                           description: products.description ,
                             stock:   products.quantity,
                             
                           stock_status:true,
                            regular_price: products.regularPrice,
                            sales_price:products.salesPrice,
                                 image: images,
                                volume: products.volume

            })

            await newProduct.save();
            return res.redirect("/admin/addProducts")

          }else {
            return res.status(400).json("product already exists.")
          }


    } catch (error) {
        console.log("error saving the product",error)
        res.redirect("/admin/pageError")
    }
}

const listProducts =async (req,res)=>{
  try {

    const search = req.query.search || '';
    const page = req.query.page || 1;
    const limit = 4;

    const productData = await product.find({
            $or:[

              {productName:{$regex:new RegExp(".*"+search+".*","i") }},

            ]

    }
    ).limit(limit*1)
    .skip((page-1)*limit)

    
  } catch (error) {
    
  }
}





// express validator
const addProducts1 = async (req,res)=>{
  try {
      const products = req.body;
      const validationErrors = [];
     
      if (!products.productName || products.productName.trim().length < 3) {
          validationErrors.push('Product name must be at least 3 characters long');
      }

      if (!products.description || products.description.trim().length < 10) {
          validationErrors.push('Short description must be at least 10 characters long');
      }

      if (!products.longDescription || products.longDescription.trim().length < 10) {
          validationErrors.push('Full description must be at least 20 characters long');
      }

      if (!products.specifications || products.specifications.trim().length < 10) {
          validationErrors.push('Specifications must be at least 10 characters long');
      }

      if (!products.regularPrice || isNaN(products.regularPrice) || parseFloat(products.regularPrice) <= 0) {
          validationErrors.push('Regular price must be a positive number');
      }

      if (!products.salePrice || isNaN(products.salePrice) || parseFloat(products.salePrice) <= 0) {
          validationErrors.push('Sale price must be a positive number');
      } else if (parseFloat(products.salePrice) >= parseFloat(products.regularPrice)) {
          validationErrors.push('Sale price must be less than regular price');
      }

      if (!products.category) {
          validationErrors.push('Category is required');
      }
      

    // Image validation
    if (!req.files || req.files.length !== 4) {
        validationErrors.push('Exactly 4 product images are required');
    } else {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg','image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        for (const file of req.files) {
            if (!validTypes.includes(file.mimetype)) {
                validationErrors.push('Only JPG, JPEG, and PNG images are allowed');
                break;
            }
            if (file.size > maxSize) {
              validationErrors.push('Image size must be less than 5MB');
              break;
          }
      }
  }

  // Return validation errors if any
  if (validationErrors.length) {
      return res.status(400).json({ errors: validationErrors });
  }

  // Check for duplicate product name
  const productExists = await Product.findOne({
      productName: products.productName.trim(),
  });

  if(productExists){
      return res.status(400).json({ error: "Product already exists, please try another name" });
  }

  let images = [];

  if(req.files && req.files.length === 4){
      const uploadDir = path.join(__dirname, '../../public/uploads/product-images');
      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }
      for(let i = 0; i < req.files.length; i++){
        const file = req.files[i];
        const filename = `product-${Date.now()}-${i}.jpg`;
        const resizedImagePath = path.join(uploadDir, filename);

        try {
            // Resize and save image
            await sharp(file.path)
                .resize(450, 490, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(resizedImagePath);

            images.push(filename);

            // Delete the temporary file
            await fs.promises.unlink(file.path);
        } catch (error) {
            console.error('Error processing image:', error);
            try {
                await fs.promises.unlink(file.path);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
            }
            return res.status(500).json({ error: "Error processing image" });
        }
    }
}
const categoryId = await Category.findOne({name: products.category});

        if(!categoryId){
            return res.status(400).json({ error: "Invalid category name" });
        }
        const newProduct = new Product({
            productName: products.productName.trim(),
            description: products.description.trim(),
            longDescription: products.longDescription.trim(),
            specifications: products.specifications.trim(),
            category: categoryId._id,
            brand: products.brand,
            regularPrice: parseFloat(products.regularPrice),
            salePrice: parseFloat(products.salePrice),
            quantity: products.quantity,
            color: products.color,
            productImages: images,
            status: "Available",
        });

        await newProduct.save();
        return res.redirect("/admin/products");
    
    } catch (error) {
        console.error('Error saving product:', error);
        return res.status(500).json({ error: "Error saving product", details: error.message });
    }
}








module.exports = {
   addProductPage,
   addProducts,
   listProducts,
   

}

