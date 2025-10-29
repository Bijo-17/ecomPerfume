const { name } = require("ejs")
const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")

const addSubcategory = async (req, res) => {

  try {
    const { id } = req.params

    const subcategory = req.body.name
    
     const existingSubcategory = await Subcategory.findOne({name: {$regex: `^${subcategory}$` ,  $options : 'i' }, category_id : id , isDeleted:false})
    
     if(existingSubcategory){
        return res.status(400).json({success: false , message : "Subcategory already exists"});
     }
    const newSubcategory = await new Subcategory({
      name: subcategory,
      category_id: id
    })

    await newSubcategory.save()
    res.status(200).json({success: true })

  }
  catch (error) {
    res.redirect("/admin/pageError")
    console.log("error adding subcategory ", error)
  }

}


const editSubcategory = async (req, res) => {
  try {
    const { catId ,  subId } = req.params;
    const { name } = req.body;
  
    const currentSubcat = await Subcategory.findById(subId)

    const existingSubcategory = await Subcategory.findOne({name: {$regex: `^${name}$` ,  $options : 'i' }, category_id : catId , isDeleted:false})
 
    if(existingSubcategory && currentSubcat._id.toString() !== existingSubcategory._id.toString()){
        return res.status(400).json({success:false , message : 'Subcategory already exists'})
    }

    await Subcategory.findByIdAndUpdate(subId, { name: name.trim() });
    res.status(200).json({success: true});
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