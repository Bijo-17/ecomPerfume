
const getBrand = async (req,res)=>{

     try {
        res.render("shopByBrand")
     } catch (error) {
        console.log("error loading brand page",error)
        res.redirect("/pageNotFound")
     }

}

module.exports = {getBrand }