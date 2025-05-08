const express = require("express")
const router = express.Router()
const adminController = require("../controller/admin/adminController")
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const subcategoryController = require("../controller/admin/subcategoryController")

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
router.get("/category",adminAuth,categoryController.categoryInfo) // list with subcategories
// router.get('/category/add', categoryController.addForm);
router.post('/category/add', categoryController.addCategory);

router.post('/category/editCategory/:id', categoryController.editCategory);
// router.post('/category/edit/:id', categoryController.updateCategory);

router.get('/category/block', categoryController.blockCategory); // list/unlist
router.get('/category/unblock', categoryController.unblockCategory);
router.get('/category/delete', categoryController.deleteCategory); // soft delete

// subcategory

// router.get('/subcategory/add', subcategoryController.addForm); // Pass category_id as query param
router.post('/subcategory/add/:id', subcategoryController.addSubcategory);

// router.get('/subcategory/edit/:id', subcategoryController.editForm);
router.post('/subcategory/edit/:id', subcategoryController.editSubcategory);

router.get('/subcategory/block/:id', subcategoryController.blockSubcategory);
router.get('/subcategory/unblock/:id', subcategoryController.unblockSubcategory);
router.get('/subcategory/delete/:id', subcategoryController.deleteSubcategory);




module.exports = router