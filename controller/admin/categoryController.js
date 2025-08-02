const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Subcategory = require("../../models/subCategorySchema")




const categoryInfo = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;


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

    // Check if category exists
    let category = await Category.findOne({ name: { $regex: `^${categoryName.trim()}$`, $options: 'i' }, isDeleted: false });

    if (category) {
      return res.status(400).json({ success: false, message: "category already existsedd" })

    }

    if (!category && categoryName.trim() !== "") {
      category = await new Category({ name: categoryName.trim(), category_offer: categoryOffer || 0 }).save();
    }

    if (subcategoryName && subcategoryName.trim() !== "") {
      await new SubCategory({
        name: subcategoryName.trim(),
        category_id: category._id
      }).save();
    }

    const product = await Product.find({ category_id: category._id })


    if (categoryOffer > 0) {

      product.forEach(prod => {

        let category_offer = (prod.sales_price * (1 - category.category_offer / 100)).toFixed(2)
        let offer_price = parseFloat((prod.sales_price * (1 - prod.offer_price / 100)).toFixed(2))
        prod.final_price = category_offer < offer_price ? category_offer : offer_price

      })
    }

    await product.save();


    res.status(200).json({ success: true, message: "ok done" });
  } catch (err) {
    console.error("Error adding category/subcategory:", err);
    res.redirect('/admin/pageError');
  }
};


const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
      
    const offer = req.body.offer || 0

    await Category.findByIdAndUpdate(id, { name: name.trim(), category_offer: offer });

    const product = await Product.find({ category_id: id })



    for (let prod of product) {

      let category_offer = parseFloat((prod.sales_price * (1 - offer / 100)).toFixed(2))
      let offer_price = parseFloat((prod.sales_price * (1 - prod.offer_price / 100)).toFixed(2))
      prod.final_price = category_offer < offer_price ? category_offer : offer_price

      await prod.save()
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

    // Also  delete subcategories
    await Subcategory.updateMany({ category_id: id }, { $set: { isDeleted: true } });

    res.redirect('/admin/category');
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
