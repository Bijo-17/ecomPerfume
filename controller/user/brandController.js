
 const Brand = require('../../models/brandSchema');


const getBrand = async (req,res)=>{

     try {
 
    const brands  =  await Brand.find({isDeleted:false})


        res.render("shopByBrand" , {brands})
     } catch (error) {
        console.log("error loading brand page",error)
        res.redirect("/pageNotFound")
     }

}

module.exports = {getBrand }