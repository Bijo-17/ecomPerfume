const { concurrency, block } = require("sharp")
const Brand = require("../../models/brandSchema")
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const Product = require('../../models/productSchema')

const addBrandPage = async (req, res) => {

   try {

      const page = parseInt(req.query.page) || 1
      const limit = 5

      const bandData = await Brand.find({ isDeleted: false })
         .limit(limit)
         .skip((page - 1) * limit)
         .sort({ createdAt: -1 })
         .exec()

      const count = await Brand.countDocuments({ isDeleted: false })


      res.render("addBrands", {
         data: bandData,
         currentPage: page,
         totalPages: Math.ceil(count / limit)


      })


   } catch (error) {
      console.log("error in loading brand page" , error)
      return res.redirect("/admin/pageErorr")
   }


}

const addBrand = async (req, res) => {

   try {
      const details = req.body


      let image = req.file ? req.file.filename : null;

      const brand = await Brand.findOne({ name: { $regex: `^${details.name.trim()}$`, $options: 'i' }, isDeleted: false })

      if (details.name.length < 3) {

         return res.status(400).json({ success: false, message: "Brand name should be atleast three charactes long" })

      }


      if (brand) {

         if (image) {
            fs.unlinkSync(req.file.path)
         }
         return res.status(400).json("Brand already exists")

      }

      if (image) {
         const brandImagePath = path.join('public', 'uploads', 'brand-images', 'brand-' + req.file.filename);
         await sharp(req.file.path).resize({ width: 440, height: 440 }).toFile(brandImagePath);
         fs.unlinkSync(req.file.path)
         image = '/uploads/brand-images/brand-' + req.file.filename;

      }

      const newBrand = await new Brand({
         name: details.name.trim(),
         offer: details.offer || 0,
         image: image
      })

      await newBrand.save()

      res.status(200).json({ success: true, message: "brand added sucessfully" })


   } catch (error) {
      console.log("error saving the product", error)
      res.redirect("/admin/pageError")


   }

}

const editBrand = async (req, res) => {
   try {
      const id = req.params.id
      const data = req.body
      let image = req.file ? req.file.filename : ''

      const currentBrand = await Brand.findOne({ _id: id })
      const brand = await Brand.findOne({ name: { $regex: `^${data.name.trim()}$`, $options: 'i' }, isDeleted: false })


      if (brand && brand.name.toLowerCase() !== currentBrand.name.toLowerCase()) {
         return res.status(400).json({ success: false, message: "Brand Already exists" });
      }


      await Brand.findByIdAndUpdate(id, { name: data.name.trim(), offer: data.offer.trim() || 0 })

      if (image) {

         const brandImagePath = path.join('public', 'uploads', 'brand-images', 'brand-' + req.file.filename);
         await sharp(req.file.path).toFile(brandImagePath)
         fs.unlinkSync(req.file.path)
         fs.unlinkSync(path.join('public', currentBrand.image));
         await currentBrand.save();
         image = '/uploads/brand-images/brand-' + req.file.filename;
         await Brand.findByIdAndUpdate(id, { image: image })
      }



      res.status(200).json({ success: true, message: "Brand edited" });


   } catch (error) {
      console.log("error in editing brand ", error)
      res.status(500).json({ success: false, message: "server Error" });

   }
}

const blockBrand = async (req, res) => {
   try {
      const id = req.params.id
      if (id) {
         await Brand.updateOne({ _id: id }, { $set: { status: 'block' } })
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in blocking brand", error)
      res.redirect("/admin/pageError")
   }
}

const unblockBrand = async (req, res) => {
   try {
      const id = req.params.id
      if (id) {
         await Brand.updateOne({ _id: id }, { $set: { status: 'active' } })
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in unblocking brand", error)
      res.redirect("/admin/pageError")
   }
}

const deleteBrand = async (req, res) => {
   try {
      const id = req.params.id
      if (id) {
         await Brand.findByIdAndDelete({ _id: id })
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in deleting brand", error)
      res.redirect("/admin/pageError")
   }
}

module.exports = {
   addBrandPage,
   addBrand,
   editBrand,
   blockBrand,
   unblockBrand,
   deleteBrand

}