
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');

const getCategory = async (req,res)=>{

     try{
        
       const categories = await Category.find({isDeleted:false , status: 'active'});

       const user = await User.findById(req.session.user)
 
        res.render('shopByCategory' , {categories , user});
 
     }
     catch(error){
        console.log("error in loading category Page" , error);
        res.redirect('/pageError');
     }

}


module.exports = {  getCategory }
