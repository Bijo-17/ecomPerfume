const express = require("express")
const router = express.Router()
const adminController = require("../controller/admin/adminController")


router.get("/",adminController.loadLogin)
router.post("/verify",adminController.verifyAdmin)

module.exports = router