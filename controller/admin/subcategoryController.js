const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")

const addSubcategory = async (req, res) => {

  try {
    const { id } = req.params
    console.log("req.body" , req.body)
    const subcategory = req.body.name

    const newSubcategory = await new Subcategory({
      name: subcategory,
      category_id: id
    })

    await newSubcategory.save()
    res.redirect("/admin/category")

  }
  catch (error) {
    res.redirect("/admin/pageError")
    console.log("error adding subcategory ", error)
  }


}


const editSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await Subcategory.findByIdAndUpdate(id, { name: name.trim() });
    res.redirect('/admin/category');
  } catch (error) {
    console.error("Error editing category:", error);
    res.redirect('/admin/pageError');
  }
};


const blockSubcategory = async (req, res) => {
  try {
    let id = req.params.id;

    await Subcategory.updateOne({ _id: id }, { $set: { status: "blocked" } });

    res.redirect("/admin/category")

  } catch (error) {
    res.redirect("/pageError")

  }
}

const unblockSubcategory = async (req, res) => {
  try {
    let id = req.params.id;

    await Subcategory.updateOne({ _id: id }, { $set: { status: "active" } });

    res.redirect("/admin/category")

  } catch (error) {
    res.redirect("/pageError")

  }
}



const deleteSubcategory = async (req, res) => {
  try {
    const id = req.params.id;

    await Subcategory.findByIdAndUpdate(id, { isDeleted: true });

    res.redirect('/admin/category');
  } catch (error) {
    console.error("Error deleting category:", error);
    res.redirect('/pageError');
  }
};



module.exports = {
  addSubcategory,
  editSubcategory,
  blockSubcategory,
  unblockSubcategory,
  deleteSubcategory
}