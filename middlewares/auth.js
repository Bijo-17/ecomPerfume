
const User = require("../models/userSchema")


const userAuth = async (req,res,next)=>{
    try{ 
       const userId = req.session.user

          if (!userId) {
            return res.redirect('/login');
        }
         
       const user = await User.findById(userId);

         if (!user || user.isBlocked) {
            req.session.user=null; // clear session
            return res.render("login", {message:"Your account is blocked by admin", activeTab: "login" });
        } 

        if(user.isDeleted){
             req.session.user= null;
             return res.render("login", {message:"User not found", activeTab: "login"})
        }

        next();



    } catch(error)   {


            console.log("Error in user atuth middleware",error);
           return res.status(500).send("Internal Server error")
        
    }
   
}

const adminAuth = (req,res,next)=>{
    if(req.session.admin){
    User.findOne({isAdmin:true})
    .then(data=>{
            if(data){
                next()
            } else {
                res.redirect("/admin/login")
            }
    })
    .catch(error=>{
        console.log("error in adminauth middleware",error)
        res.status(500).redirect('/pageError')
    })
} else{
    res.redirect("/admin/login")
}
}

module.exports = {
    userAuth,
    adminAuth
}