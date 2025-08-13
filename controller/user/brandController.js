
 const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema');

const getBrand = async (req,res)=>{

     try {
 
    const brands  =  await Brand.find({isDeleted:false , status:'active'})
    const user = await User.findById(req.session.user)

        res.render("shopByBrand" , {brands , user})
     } catch (error) {
        console.log("error loading brand page",error)
        res.redirect("/pageNotFound")
     }

}

module.exports = {getBrand }