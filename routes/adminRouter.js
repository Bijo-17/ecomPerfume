const express = require("express")
const router = express.Router()
const adminController = require("../controller/admin/adminController")
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const subcategoryController = require("../controller/admin/subcategoryController")
const productController = require("../controller/admin/productController")
const brandController = require("../controller/admin/brandController")
const orderController = require("../controller/admin/orderController")
const couponController = require("../controller/admin/couponController")
const dashboardController = require("../controller/admin/dashboardController")
const bannerController = require("../controller/admin/bannerController")


const uploads = require("../helpers/multer")
const {adminAuth} = require("../middlewares/auth")

router.get("/login",adminController.loadLogin)


router.post("/verify",adminController.verifyAdmin)

router.get("/pageError",adminController.pageError)

// router.get("/",adminController.loadDashboard)

router.get("/logout",adminAuth,adminController.logout)

// customer management
router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked)

// category Management
router.get("/category",adminAuth,categoryController.categoryInfo) // list with subcategories
// router.get('/category/add', categoryController.addForm);
router.post('/category/add',adminAuth, uploads.single('image'),categoryController.addCategory);

router.post('/category/editCategory/:id', adminAuth, uploads.single('image'), categoryController.editCategory);
// router.post('/category/edit/:id', categoryController.updateCategory);

router.get('/category/block', categoryController.blockCategory); // list/unlist
router.get('/category/unblock', categoryController.unblockCategory);
router.get('/category/delete', categoryController.deleteCategory); // soft delete

// subcategory


router.post('/subcategory/add/:id', subcategoryController.addSubcategory);
router.post('/subcategory/edit/:catId/:subId', subcategoryController.editSubcategory);
router.get('/subcategory/block/:id', subcategoryController.blockSubcategory);
router.get('/subcategory/unblock/:id', subcategoryController.unblockSubcategory);
router.get('/subcategory/delete/:id', subcategoryController.deleteSubcategory);

// brand

router.get('/addBrand',adminAuth,brandController.addBrandPage)
router.post('/addBrand',adminAuth,uploads.single('image'),brandController.addBrand)
router.post('/addBrand/edit/:id',uploads.single('image'), brandController.editBrand);
router.get('/addBrand/block/:id', brandController.blockBrand);
router.get('/addBrand/unblock/:id', brandController.unblockBrand);
router.get('/addBrand/delete/:id',adminAuth, brandController.deleteBrand);

// banner mangement

router.get('/banner',adminAuth,bannerController.loadBannerPage)
router.get('/addBanner',adminAuth,bannerController.addBannerPage)
router.post('/addBanner', adminAuth,uploads.single('image'),bannerController.addBanner)
router.get('/deleteBanner/:id',adminAuth,bannerController.deleteBanner)
router.post('/editBanner',adminAuth,uploads.single('image'),bannerController.editBanner)


// produc management 

router.get('/addProduct',adminAuth,productController.addProductPage)
router.post('/addProduct',adminAuth,uploads.array("images",4),productController.addProducts)
router.get('/products',adminAuth,productController.listProducts)
router.get('/products/block/:id/:page',adminAuth,productController.blockProduct)
router.get('/products/unblock/:id/:page',adminAuth,productController.unblockProduct)
router.get('/products/delete/:id/:page',adminAuth,productController.deleteProduct)
router.post('/products/addOffer/:id',productController.addOffer)
router.post('/products/removeOffer/:id',productController.removeOffer)
router.patch('/products/edit/:id',adminAuth,uploads.array("images",4),productController.editProduct)

// orders 

router.get('/orderList',adminAuth,orderController.getOrders)
router.get('/orderDetails/:orderId/:productId',adminAuth,orderController.orderDetails)
router.post('/verifyReturn/:orderId/:productId',adminAuth,orderController.approveReturn)
router.post('/cancelReturn/:orderId/:productId',adminAuth,orderController.cancelReturn)
router.post('/updateOrderStatus/:orderId/:productId',adminAuth,orderController.updateOrderStatus)

// coupon
 
router.get('/coupon',adminAuth,couponController.getCoupon)
router.post('/createCoupon',adminAuth,couponController.createCoupon)
router.get('/deleteCoupon',adminAuth,couponController.deleteCoupon)
router.post('/editCoupon',adminAuth,couponController.editCoupon)

// dashboard 

router.get('/',adminAuth,dashboardController.getSalesReport)
router.post('/generatePdf',dashboardController.exportSalesReport)
router.get('/chart',dashboardController.getChartData)
router.get('/topItems',dashboardController.getTopItems)



module.exports = router