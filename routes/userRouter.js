
const express = require("express")
const router = express.Router()
const userController = require("../controller/user/userController")
const profileController = require("../controller/user/profileController")
const User = require("../models/userSchema")
const passport = require("passport")
const {userAuth} = require("../middlewares/auth")
const brandController = require("../controller/user/brandController")
const productController = require("../controller/user/productController")
const addressController = require("../controller/user/addressController")
const cartController = require("../controller/user/cartController")
const orderController = require("../controller/user/orderController")
const uploads = require("../helpers/multer")
const walletController = require("../controller/user/walletController")
const wishlistController = require("../controller/user/wishlistController")

router.get("/pageNotFound",userController.pageNotFound)

router.get("/",userController.loadHome)
router.get("/home",userAuth,userController.userHome)

router.get("/login/",userController.loadLogin)
router.get("/register",userController.loadRegister)
router.post("/register",userController.registerUser)

router.post("/verifyOtp",userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)

router.post("/verify",userController.verifyUser)




router.get("/logout",userController.logout);

router.get("/auth/google",passport.authenticate('google',{scope: ['profile','email']}));

router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect: '/register'}),(req,res)=>{
    console.log("sesssion",req.session,"\n end of session........")
    console.log("req.session.passport",req.session.passport.user)
    req.session.user = req.session.passport.user
    res.redirect("/home") 
});




//profile management

router.get("/forgotPassword",profileController.loadPasswordReset)
router.post("/resetPassword",profileController.resetPassword)
router.post("/resendForgotOtp",profileController.resendOtp)
router.get("/changePassword",profileController.newPasswordPage)
router.post("/forgotPasswordOtpVerify",profileController.verifyOtp)
router.post("/saveNewPassword",profileController.SaveNewPassword)
router.get("/account",profileController.loadAccount) 

router.patch("/editAccount",uploads.single('profileImage'),profileController.editAccount)
router.post('/changeEmail',profileController.changeEmail)
router.post('/verifyChangeEmail',profileController.verifyChangeEmail)
router.get('/changeEmail',profileController.saveNewEmail)       
router.post('/changePassword',userAuth,profileController.changePassword)


// brand management

router.get("/brand",brandController.getBrand)


// product managemet

router.get("/product/:category",productController.getAllProducts)

// router.get("/product/:category/sort",productController.getAllProducts)

router.get("/product",productController.getAllProducts)

router.get("/productDetails/:id",productController.productDetails)

router.post('/rateProduct/:productId',productController.rateProduct);


// address 

router.get("/address",userAuth,addressController.getAddress)
router.post("/address/addAddress",userAuth,addressController.addAddress)
router.post("/address/editAddress",userAuth,addressController.editAddress)
router.delete("/address/:id",addressController.deleteAddress)
router.post("/address/setDefault/:id",userAuth,addressController.setDefault)

router.post("/address/add",userAuth,addressController.addAddressCheckout)
router.post("/address/edit",userAuth,addressController.editAddressCheckout)


// wishlist 

router.get("/wishlist",userAuth,wishlistController.getWishlist)
router.post("/addToWishlist/:id",wishlistController.addToWishlist)
router.get("/wishlist/remove/:productId",userAuth,wishlistController.removeProduct)

// cart

router.get("/cart",cartController.getCart);
router.post("/addTocart/:id",cartController.addToCart)
router.get("/cart/remove/:id",userAuth,cartController.removeProduct)
router.post("/cart/validate-before-checkout",userAuth,cartController.validateCart)
router.get("/checkout",userAuth,cartController.checkout)




// order 

router.get("/orders",userAuth,orderController.getOrder)
router.post("/orders/cod",userAuth,orderController.placeOrder)
router.get("/orders/success",userAuth,orderController.orderPlaced)
router.post("/orders/downloadInvoice/:orderId/:productId",orderController.generateInvoice)
router.get("/downloadInvoice/:orderId/:productId",orderController.generateInvoice)
          
router.post("/returnOrder/:orderId/:productId",orderController.returnProduct)
router.post("/cancelOrder/:orderId/:productId",orderController.cancelProduct)


// wallet 

router.get("/wallet",userAuth,walletController.getWallet)



module.exports = router




