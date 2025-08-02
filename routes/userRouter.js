
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
const checkoutController = require("../controller/user/checkoutController")
const referralController = require("../controller/user/referralController")
const searchController = require("../controller/user/searchController")
const deleteAccountController = require("../controller/user/deleteAccountController")

router.get("/pageNotFound",userController.pageNotFound)
router.get("/pageError",userController.pageError)

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

// search 

router.get("/search",searchController.search)

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
router.get("/verifyEmailOtp",profileController.loadEmailOtp)      
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
router.get("/cart/remove/:id/:volume",userAuth,cartController.removeProduct)
router.post("/cart/validate-before-checkout",userAuth,cartController.validateCart)
router.get("/checkout",userAuth,cartController.checkout)
router.post("/updateCart",userAuth,cartController.updateCart)




// order 

router.get("/orders",userAuth,orderController.getOrder)

router.get("/orders/success",userAuth,orderController.orderPlaced)
router.get("/orders/failed",userAuth,orderController.orderFailed)
router.post("/orders/downloadInvoice/:orderId/:productId",orderController.generateInvoice)
router.get("/downloadInvoice/:orderId/:productId",orderController.generateInvoice)
          
router.post("/returnOrder/:orderId/:productId",orderController.returnProduct)
router.post("/cancelOrder/:orderId/:productId",orderController.cancelProduct)

router.post("/orders/cod",userAuth,checkoutController.placeOrder)
router.post("/orders/razorpay",userAuth,checkoutController.razorpayPayment)
router.post("/orders/razorpay/verify",userAuth,checkoutController.verifyRazorpayPayment)

router.post("/applayCoupon",userAuth,checkoutController.applayCoupon)
router.post("/removeCoupon",checkoutController.removeCoupon)

// retry payment  

router.post("/retryPayment",checkoutController.retryPayment)


// wallet 

router.get("/wallet",userAuth,walletController.getWallet)

// refer and earn 

router.get("/referandEarn",userAuth,referralController.getReferral)

// delete account 

router.get("/delete-account",userAuth,deleteAccountController.loadDeleteAccount)
router.get("/deleteAccount",userAuth,deleteAccountController.deleteAccount)


module.exports = router




