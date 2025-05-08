const Category = require("../../models/categorySchema")
const Subcategory = require("../../models/subCategorySchema")

const addSubcategory = async (req,res)=>{

    try{ 
    const {id } = req.params
    const subcategory = req.body.name 

    console.log("subcategory",id)

    const newSubcategory = await new Subcategory({
        name:subcategory,
        category_id:id
    })

    await newSubcategory.save()
    res.redirect("/admin/category")

    }
    catch(error){
        res.redirect("/admin/pageError")
        console.log("error adding subcategory ", error)
    }
    

}


const editSubcategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      console.log(id)
      console.log(name)
  
      await Subcategory.findByIdAndUpdate(id, { name: name.trim() });
      res.redirect('/admin/category');
    } catch (error) {
      console.error("Error editing category:", error);
      res.redirect('/admin/pageError');
    }
  };


  const blockSubcategory = async (req,res)=>   {
    try {
     let id = req.params.id;
     console.log(id)
     await Subcategory.updateOne({_id:id}, {$set:{status:"blocked"}});
    
     res.redirect("/admin/category")
     
    } catch (error) {
     res.redirect("/pageError")
     
    }
 }
 
 const unblockSubcategory = async (req,res)=>   {
     try {
      let id = req.params.id;
      console.log("unblock id:",id)
      await Subcategory.updateOne({_id:id}, {$set:{status:"active"}});
   
      res.redirect("/admin/category")
      
     } catch (error) {
      res.redirect("/pageError")
      
     }
  }
 
 

  const deleteSubcategory = async (req, res) => {
    try {
      const  id  = req.params.id;
      console.log("deleteid",id)
  
      
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