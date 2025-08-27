const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Subcategory = require("../../models/subCategorySchema");
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const Varient = require("../../models/varientsSchema");


const categoryInfo = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;
    const message = req.query.message || '';

    const totalCategories = await Category.countDocuments({ isDeleted: false });

    const categories = await Category.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const subcategories = await Subcategory.find({ isDeleted: false }).lean();

    // Attach subcategories to their respective categories
    categories.forEach(category => {
      category.subcategories = subcategories.filter(sub =>
        sub.category_id.toString() === category._id.toString()
      );
    });


    res.render('category', {
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategories / limit),
      message
    });
  } catch (error) {
    console.error("Error rendering category view:", error);
    res.redirect('/admin/pageError');
  }
};



const addCategory = async (req, res) => {

  try {

    const { categoryName, subcategoryName } = req.body;
    const categoryOffer = parseFloat(req.body.categoryOffer)

    // Checking for category exists
    let category = await Category.findOne({ name: { $regex: `^${categoryName.trim()}$`, $options: 'i' }, isDeleted: false });

    if (category) {
      return res.status(400).json({ success: false, message: "category already existsedd" })

    }

    let category_image;

    if (req.file) {
      const categoryPath = path.join('public', 'uploads', 'category-images', 'category-' + req.file.filename)
      await sharp(req.file.path).resize({ width: 320, height: 320 }).toFile(categoryPath)
      //  fs.unlinkSync(req.file.path)
      category_image = '/uploads/category-images/category-' + req.file.filename;
    }


    if (!category && categoryName.trim() !== "") {
      category = await new Category({ name: categoryName.trim(), category_offer: categoryOffer || 0, category_image }).save();
    }


    if (subcategoryName && subcategoryName.trim() !== "") {
      await new Subcategory({
        name: subcategoryName.trim(),
        category_id: category._id
      }).save();
    }


    res.status(200).json({ success: true, message: "Category Added successfully" });

  } catch (err) {
    console.error("Error adding category/subcategory:", err);
    res.redirect('/admin/pageError');
  }
};


const editCategory = async (req, res) => {

  try {

    const { id } = req.params;
    const { name } = req.body;
    const page = parseInt(req.query.page);

    const offer = req.body.offer || 0

    const currentCat = await Category.findById(id);

    if (currentCat.name !== name.trim()) {

      const existingCat = await Category.findOne({ name: { $regex: `^${name}$`, '$options': 'i' }, isDeleted: false });

      if (existingCat && currentCat._id.toString() !== existingCat._id.toString()) {
        if (page && page > 1) {
          return res.status(400).redirect(`/admin/category?page={$page}&&message=Category Already Exists`)
        }
        return res.status(400).redirect('/admin/category?message=Category Already Exists')
      }

    }

    await Category.findByIdAndUpdate(id, { name: name.trim(), category_offer: offer });

    if (req.file) {
      const categoryPath = path.join('public', 'uploads', 'category-images', 'category-' + req.file.filename)
      await sharp(req.file.path).resize({ width: 320, height: 320 }).toFile(categoryPath)
      fs.unlinkSync(req.file.path)
      let category_image = '/uploads/category-images/category-' + req.file.filename;
      await Category.findByIdAndUpdate(id, { category_image: category_image })
    }

    const product = await Product.find({ category_id: id, isDeleted: false })


    for (let prod of product) {

      const varient = await Varient.findOne({ product_id: prod._id });

      varient?.inventory.forEach(v => {

        let category_offer = parseFloat((v.sales_price * (1 - offer / 100)).toFixed(2))
        let offer_price = parseFloat((v.sales_price * (1 - prod.offer_price / 100)).toFixed(2))
        v.final_price = category_offer < offer_price ? category_offer : offer_price

      })

      await varient.save()

    }

    if (page && page > 1) {
      return res.redirect(`/admin/category?page=${page}`)
    }

    res.redirect('/admin/category');
  } catch (error) {
    console.error("Error editing category:", error);
    res.redirect('/admin/pageError');
  }
};


const blockCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { status: "blocked" } });
    await Subcategory.updateMany({ category_id: id }, { status: 'blocked' });
    res.redirect("/admin/category")


  } catch (error) {
    res.redirect("/admin/pageError")

  }
}

const unblockCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { status: "active" } });
    await Subcategory.updateMany({ category_id: id }, { status: 'active' });
    res.redirect("/admin/category")

  } catch (error) {
    res.redirect("/admin/pageError")

  }
}



const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;

    //  delete category
    await Category.findByIdAndUpdate(id, { isDeleted: true });

    // delete subcategories
    await Subcategory.updateMany({ category_id: id }, { $set: { isDeleted: true } });

    res.status(200).json();

  } catch (error) {
    console.error("Error deleting category:", error);
    res.redirect('/pageError');
  }
};





module.exports = {

  categoryInfo,
  addCategory,
  editCategory,
  blockCategory,
  unblockCategory,
  deleteCategory
}
