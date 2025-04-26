
const pageNotFound = async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const loadHome = async (req,res)=>{
    try {

        return res.render("landingPage")
        
    } catch (error) {
        console.log("failed to load homePage", error.message)
        res.status(500).send("unable to load server")
        
    }
}

module.exports ={
    loadHome,
    pageNotFound
}




