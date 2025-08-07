
const Category = require('../../models/categorySchema');

const getCategory = async (req,res)=>{

     try{
        
       const categories = await Category.find({isDeleted:false});
 
        res.render('shopByCategory' , {categories});
 
     }
     catch(error){
        console.log("error in loading category Page" , error);
        res.redirect('/pageError');
     }

}


module.exports = {  getCategory }
