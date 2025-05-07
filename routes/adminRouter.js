const express = require("express")
const router = express.Router()
const adminController = require("../controller/admin/adminController")
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const {userAuth , adminAuth} = require("../middlewares/auth")

router.get("/login",adminController.loadLogin)


router.post("/verify",adminController.verifyAdmin)

router.get("/pageError",adminController.pageError)
router.get("/",adminController.loadDashboard)

router.get("/logout",adminAuth,adminController.logout)

// customer management
router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked)

// category Management
router.get("/category",adminAuth,categoryController.categoryInfo)

module.exports = router