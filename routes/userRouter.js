
const express = require("express")
const router = express.Router()
const userController = require("../controller/user/userController")
const profileController = require("../controller/user/profileController")
const User = require("../models/userSchema")
const passport = require("passport")


router.get("/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHome)
router.get("/login/",userController.loadLogin)
router.get("/register",userController.loadRegister)
router.post("/register",userController.registerUser)

router.post("/verifyOtp",userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)

router.post("/verify",userController.verifyUser)

router.get("/logout",userController.logout);

router.get("/auth/google",passport.authenticate('google',{scope: ['profile','email']}));

router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect: '/register'}),(req,res)=>{
    res.redirect("/") 
});




//profile management

router.get("/forgotPassword",profileController.loadPasswordReset)
router.post("/resetPassword",profileController.resetPassword)
router.post("/forgotPasswordOtpVerify",profileController.verifyOtp)
router.post("/saveNewPassword",profileController.SaveNewPassword)
router.get("/account",profileController.loadAccount) 

router.patch("/editAccount",profileController.editAccount)
       
router.get("/orders",(req,res)=>{
    res.render("account",{layout:"../layout/userAccount", active:"orders", user:"buddy" , typescript:"order"})
})






module.exports = router




