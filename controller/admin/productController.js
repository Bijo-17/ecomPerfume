
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")
const Brand = require("../../models/brandSchema")
const User = require("../../models/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { image } = require("pdfkit")
const Varients = require("../../models/varientsSchema")
const { verifyRazorpayPayment } = require("../user/checkoutController")


const addProductPage = async (req, res) => {
  try {

    const category = await Category.find({ status: 'active', isDeleted: false })
    const subcategory = await Subcategory.find({ status: 'active', isDeleted: false }).populate('category_id')
    const brand = await Brand.find({ status: 'active' , isDeleted: false })
    const message = req.query.message || '';

    res.render("addProduct", {
      cat: category,
      subcat: subcategory,
      brand,
      message
    })


  } catch (error) {
    res.redirect("/admin/pageError")
    console.error("unable to add product ", error)

  }
}

const addProducts = async (req, res) => {
  try {

    const product = req.body;

    const productExists = await Product.findOne({ product_name: { $regex: product.productName, $options: "i" } });

    if (!productExists) {
      const images = [];


      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const resizedImagePath = path.join('public', 'uploads', 'product-images', 'product-Img'+ req.files[i].filename);
          await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
          fs.unlinkSync(originalImagePath)
          images.push('/uploads/product-images/product-Img' + req.files[i].filename);
        }
      }


      const category = await Category.findOne({ _id: product.categoryId });

      const subcategory = await Subcategory.findOne({ name: product.subcategory });

      const brand = await Brand.findOne({ name: product.brand })

      if (!category) {
        return res.status(400).json("Invalid category name")
      }

      let final_price = product.salesPrice[0];

      if (category.category_offer > 0) {

        final_price = parseFloat((product.salesPrice[0] * (1 - category.category_offer / 100)).toFixed(2))

      }

      let inventory = [];
      let volume = [];



      product.volume.forEach((element, i) => {
        final_price = category.category_offer > 0 ? parseFloat((product.salesPrice[i] * (1 - category.category_offer / 100)).toFixed(2)) : product.salesPrice[i]
        inventory.push({
          volume: element,
          stock: product.stock[i],
          regular_price: product.regularPrice[i],
          sales_price: product.salesPrice[i],
          final_price: final_price
        })

        volume.push(element)

      });


      const varients = new Varients({
        inventory: inventory
      })

      await varients.save();



      const newProduct = new Product({

        product_name: product.productName,
        category_id: category._id,
        subcategory_id: subcategory ? subcategory._id : null,
        brand_id: brand._id,
        isBlocked: false,
        description: product.description,
        stock: product.quantity,
        varients_id: varients._id,
        stock_status: true,
        regular_price: product.regularPrice[0],
        sales_price: product.salesPrice[0],
        image: images,
        volume: volume,
        final_price,
        stock: product.stock[0]

      })

      await newProduct.save();

      await Varients.findOneAndUpdate({ _id: newProduct.varients_id }, { product_id: newProduct._id });

      return res.redirect("/admin/addProduct?message=Product Added Successfully")

    } else {
      return res.status(400).redirect("/admin/addProduct?message=product already exists");

    }


  } catch (error) {
    console.log("error saving the product", error)
    res.redirect("/admin/pageError")
  }
}

const listProducts = async (req, res) => {
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
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('category_id')
      .populate('subcategory_id')
      .populate('brand_id')
      .exec();

    const varients = await Varients.find().sort({ createdAt: -1 })



    const varient = varients.filter((v) => {

      return productData.some(p => p._id.toString() === v.product_id.toString())
    })




    const count = await Product.countDocuments(filter)

    const category = await Category.find({ isDeleted: false });

    const subcategory = await Subcategory.find({ isDeleted: false })

    const brand = await Brand.find({ isDeleted: false })


    if (category) {
      res.render("products", {
        data: productData,
        cat: category,
        subcat: subcategory,
        brand,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        subc: subcategory ? subcategory : "",
        search,
        varient


      })
    } else {
      res.render("pageNotFound")
    }


  } catch (error) {
    res.redirect("/admin/pageError")
    console.log(error)
  }

}

const blockProduct = async (req, res) => {

  try {

    const { id, page } = req.params;


    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });

    return res.redirect(`/admin/products?page=${page}`);

  }

  catch (error) {
    console.log("error in blocking product", error)
    res.redirect("/admin/pageError")
  }


}

const unblockProduct = async (req, res) => {

  try {

    const { id, page } = req.params;

    const product = await Product.findByIdAndUpdate(id, { isBlocked: false })

    return res.redirect(`/admin/products?page=${page}`);

  }

  catch (error) {
    console.log("error in blocking product", error)
    res.redirect("/admin/pageError")
  }


}

const deleteProduct = async (req, res) => {
  try {

    const productId = req.params.id;
    const currentPage = req.params.page

    const product = await Product.findByIdAndUpdate(productId, { isDeleted: true });

    return res.redirect(`/admin/products?page=${currentPage}`);

  } catch (error) {
    console.log("error in deleting product", error)
    res.redirect("/admin/pageError")
  }
}

const addOffer = async (req, res) => {
  try {
    const productId = req.params.id;

    const { offer } = req.body

    const product = await Product.findById(productId)
    const category = await Category.findById(product.category_id)




    const categoryOffer = parseFloat((product.sales_price * (1 - category.category_offer / 100)).toFixed(2))

    const offerPrice = parseFloat((product.sales_price * (1 - offer / 100)).toFixed(2))

    const finalPrice = categoryOffer < offerPrice ? categoryOffer : offerPrice


    await Product.findByIdAndUpdate(productId, { offer_price: offer, final_price: finalPrice });

    const varients = await Varients.findOne({ product_id: productId })

    const allvarients = await Varients.find({ product_id: productId })



    for (let item of varients.inventory) {

      const categoryOffer = parseFloat((item.sales_price * (1 - category.category_offer / 100)).toFixed(2))
      const offerPrice = parseFloat((item.sales_price * (1 - offer / 100)).toFixed(2))
      const finalPrice = categoryOffer < offerPrice ? categoryOffer : offerPrice
      item.final_price = finalPrice;
    }

    await varients.save()

    return res.status(200).json({ message: 'Offer added successfully' });

  } catch (error) {
    console.log("error in adding offer ", error)
    res.redirect("/admin/pageError")
  }
}


const removeOffer = async (req, res) => {
  try {
    const productId = req.params.id;
    const currentPage = req.params.page;


    const product = await Product.findById(productId)

    let finalPrice = product.sales_price;
    const category = await Category.findById(product.category_id)

    if (category.category_offer > 0) {

      const categoryOffer = parseFloat((product.sales_price * (1 - category.category_offer / 100)).toFixed(2))

      finalPrice = categoryOffer;

    }
    await Product.findByIdAndUpdate(productId, { offer_price: 0, final_price: finalPrice });

    const varients = await Varients.findOne({ product_id: productId })

    for (let item of varients.inventory) {

      let finalPrice = item.sales_price;

      if (category.category_offer > 0) {

        const categoryOffer = parseFloat((item.sales_price * (1 - category.category_offer / 100)).toFixed(2))

        finalPrice = categoryOffer;
      }

      item.final_price = finalPrice;
    }

    await varients.save()


    return res.status(200).json({ message: 'Offer removed successfully' });

  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


const editProduct = async (req, res) => {
  try {
    const editedDetails = req.body;
    const productId = req.params.id;
    const page = parseInt(req.query.page) || 1


    const imageToDelete = JSON.parse(req.body.imagesToDelete || '')


    const existing = await Product.findById(productId);


    const updatedFields = {};


    for (let key in editedDetails) {


      if (editedDetails[key] && editedDetails[key] !== JSON.stringify(existing[key])) {

        updatedFields[key] = editedDetails[key];

      }
    }

    const indexes = req.body.changedImageIndexes.split(",")

    if (req.files && req.files.length > 0) {
      const images = existing.image;

      for (let i = 0; i < req.files.length; i++) {
        const resizedImagePath = path.join('public', 'uploads', 'product-images','product-Img'+ req.files[i].filename);
        await sharp(req.files[i].path)
          .resize({ width: 440, height: 440 })
          .toFile(resizedImagePath);

        images[indexes[i]] = ('/uploads/product-images/product-Img' + req.files[i].filename);
        fs.unlinkSync(req.files[i].path)
      }
      updatedFields.image = images;
    }


    if (imageToDelete && imageToDelete.length > 0) {
      const images = existing.image;

      const indexesToDelete = imageToDelete.map(i => parseInt(i))

      const filteredImages = images.filter((_, index) => !indexesToDelete.includes(index))

      const deleteImage = images.filter(((_, index) => indexesToDelete.includes(index)))


      for (let d of deleteImage) {

        let imagePath = path.join(__dirname, '../../public', d)

        if (fs.existsSync(imagePath)) {

          fs.unlinkSync(imagePath)

        }

      }
      updatedFields.image = filteredImages;

    }




    if (updatedFields.stock && updatedFields.stock[0] > 0) {
      updatedFields.stock_status = true;

    }

    updatedFields.stock = editedDetails?.stock ? editedDetails?.stock[0] : 0

    const varient = await Varients.findOne({ product_id: productId });
    const category = await Category.findOne({ _id: editedDetails.category_id });
    const product = await Product.findOne({ _id: productId })

    let inventory = [];

    if (editedDetails.volume) {

      editedDetails?.volume?.forEach((item, i) => {

        let final_price = editedDetails.sales_price[i];

        if (category.category_offer > product.offer_price) {

          final_price = parseFloat(editedDetails.sales_price[i] * (1 - category.category_offer / 100)).toFixed(2);

        } else if (product.offer_price > 0) {

          final_price = parseFloat(editedDetails.sales_price[i] * (1 - product.offer_price / 100)).toFixed(2)
        }



        inventory.push({
          volume: item,
          stock: editedDetails.stock[i],
          regular_price: editedDetails.regular_price[i],
          sales_price: editedDetails.sales_price[i],
          final_price: final_price
        })


      })
    }



    await Varients.findOneAndUpdate({ product_id: productId }, { inventory })



    updatedFields.varients_id = varient._id
    updatedFields.regular_price = editedDetails?.regular_price[0]
    updatedFields.sales_price = editedDetails?.sales_price[0]


    await Product.findByIdAndUpdate(productId, updatedFields, { new: true });


    res.redirect(`/admin/products?page=${page}`)


  } catch (error) {
    console.error('Error editing product:', error);
    res.status(500).redirect("/admin/pageError");
  }
}






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


}

