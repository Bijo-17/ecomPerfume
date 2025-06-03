const { concurrency, block } = require("sharp")
const Brand = require("../../models/brandSchema")

const addBrandPage = async (req,res)=>{

     try {

        const page= parseInt(req.query.page) || 1
        const limit = 5

        const bandData = await Brand.find({isDeleted:false})
        .limit(limit)
        .skip((page-1)*limit)
        .sort({createdAt:-1})
        .exec()

        const count = await Brand.countDocuments({isDeleted:false})
         
        console.log("count",count)
      //   console.log("bandData",bandData);

        res.render("addBrands",{
            data:bandData,
            currentPage:page,
            totalPages:  Math.ceil(count/limit)
        
        
        })
     } catch (error) {
        return res.redirect("/admin/pageErorr")
     }


}

const addBrand = async (req,res)=>{

      try {
         const details = req.body
          console.log("reqbody",details)
           console.log("req.files",req.file);

         const image=req.file? req.file.filename : null;
         console.log("iamge",image)
        
         const brand = await  Brand.findOne({name:{ $regex: `^${details.name.trim()}$`, $options: 'i' },isDeleted:false})
            
      //   console.log("brand",brand)
        
        if(details.name.length < 3){
            console.log("brand lenghth ",details.name.length)
               return res.status(400).json({success:false,message:"Brand name should be atleast three charactes long"})
         
        }


         if(brand){
            console.log("entered existed")
            return res.status(400).json("Brand already exists")

         } else {

            const newBrand = await new Brand({
                name: details.name.trim(),
                offer: details.offer || null,
                image:image 
            })

            await newBrand.save()
            console.log("saved")
             res.status(200).json({success:true,message:"brand added sucessfully"})
            

         }


      } catch (error) {
             console.log("error saving the product",error)
               res.redirect("/admin/pageError")
    
        
      }

}

const editBrand = async (req,res)=>{
   try {
      const id = req.params.id
      const data = req.body
      const image = req.file ? req.file.filename : ''

      console.log('data',data)
      console.log('files',image)

      const brand = await  Brand.findOne({name:{ $regex: `^${data.name.trim()}$`, $options: 'i' },isDeleted:false})

      if(brand){
         return res.status(400).json("Brand Already exists");
      } else{
        
           await  Brand.findByIdAndUpdate(id, {name:data.name.trim(), offer:data.offer.trim() ,image: image })
      }

         res.redirect("/admin/addBrand")


   } catch (error) {
      console.log("error in editing brand ",error)
      res.redirect('/admin/pageError')
      
   }
}

const blockBrand = async (req,res)=>{
   try {
      const id = req.params.id
      if(id){
         await Brand.updateOne({_id:id}, {$set:{status:'block'}}) 
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in blocking brand",error)
      res.redirect("/pageError")
   }
}

const unblockBrand = async (req,res)=>{
   try {
      const id = req.params.id
      if(id){
         await Brand.updateOne({_id:id}, {$set:{status:'active'}}) 
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in blocking brand",error)
      res.redirect("/pageError")
   }
}

const deleteBrand = async (req,res)=>{
   try {
      const id = req.params.id
      if(id){
         await Brand.findByIdAndDelete({_id:id}) 
         return res.redirect("/admin/addBrand")
      }
   } catch (error) {
      console.log("error in blocking brand",error)
      res.redirect("/pageError")
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