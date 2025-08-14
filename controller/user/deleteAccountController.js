
const User = require("../../models/userSchema")


const loadDeleteAccount = async (req,res)=>{
     try {

        const userId = req.session.user

        const user = await User.findOne({_id : userId})

        res.render("deleteAccount" , {layout:"../layout/userAccount", active:"delete",user })
        
     } catch (error) {
        console.log("error in loading delete account page" , error)
        res.status(500).redirect("/pageError")
     }
}

const deleteAccount = async (req,res)=>{
   try {

     const userId = req.session.user;
    await User.findByIdAndDelete(userId);
    req.session.user = null;
    res.redirect("/")
      
   } catch (error) {
      console.log("error in deleting account",error)
      res.redirect("/")
   }
}

module.exports = {loadDeleteAccount , deleteAccount}