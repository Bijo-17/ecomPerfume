const Category = require("../../models/categorySchema")
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
  
      // Check if category exists
      let category = await Category.findOne({ name: categoryName.trim(), isDeleted:false });

  
      if (!category) {
        category = await new Category({ name: categoryName.trim() }).save();
      }
  
      if (subcategoryName && subcategoryName.trim() !== "") {
        await new SubCategory({
          name: subcategoryName.trim(),
          category_id: category._id
        }).save();
      }
  
      res.redirect('/admin/category'); // go back to Add Product page
    } catch (err) {
      console.error("Error adding category/subcategory:", err);
      res.redirect('/admin/pageError');
    }
  };


  const editCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      console.log(name)
  
      await Category.findByIdAndUpdate(id, { name: name.trim() });
      res.redirect('/admin/category');
    } catch (error) {
      console.error("Error editing category:", error);
      res.redirect('/pageError');
    }
  };


  const blockCategory = async (req,res)=>   {
    try {
     let id = req.query.id;
     console.log(id)
     await Category.updateOne({_id:id}, {$set:{status:"blocked"}});
     await Subcategory.updateMany({ category_id: id }, { status: 'blocked' });
     res.redirect("/admin/category")
     
    } catch (error) {
     res.redirect("/pageError")
     
    }
 }
 
 const unblockCategory = async (req,res)=>   {
     try {
      let id = req.query.id;
      console.log("unblock id:",id)
      await Category.updateOne({_id:id}, {$set:{status:"active"}});
      await Subcategory.updateMany({ category_id: id }, { status: 'active' });
      res.redirect("/admin/category")
      
     } catch (error) {
      res.redirect("/pageError")
      
     }
  }
 
 

  const deleteCategory = async (req, res) => {
    try {
      const  id  = req.query.id;
      console.log("deleteid",id)
  
      // Soft delete category
      await Category.findByIdAndUpdate(id, { isDeleted: true });
  
      // Also soft delete subcategories
      await Subcategory.updateMany({ category_id: id }, { isDeleted: true });
  
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
