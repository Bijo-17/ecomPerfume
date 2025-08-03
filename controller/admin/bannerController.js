const Banner = require('../../models/bannerSchema');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const loadBannerPage = async (req, res) => {
   try {

       const banner = await Banner.find({isDeleted : false} )

       for(let b of banner){

       if( b.end_date ) {

          b.end_date.setHours(23, 59 , 59 , 999) 

          if(b.end_date < new Date ()){
             b.status = false;
          }
          
         }
          await b.save()
       } 

  
      res.render('banner' ,{banner})
   }
   catch (error) {
      console.log("error in loading the banner page" , error)
      res.redirect('/admin/pageError')
   }
}

const addBannerPage = async (req, res) => {
   res.render('addBanner')
}


const addBanner = async (req, res) => {
   try {

      const data = req.body;
      const image = req.file.filename; 
      
       if(req.file){
          const bannerPath = path.join('public','uploads', 'banner-images' ,'banner-'+req.file.filename )
         
           await sharp(req.file.path).toFile(bannerPath)
            fs.unlinkSync(req.file.path)
            data.banner_img = '/uploads/banner-images/banner-'+req.file.filename;
       }
 
      const banner = new Banner({ 
         title: data.title,
         start_date: data.startDate,
         end_date: data.endDate,
         link: data.link,
         banner_img: data.banner_img
      })
  
      await banner.save();

      res.redirect('/admin/banner')

   } catch (error) {
      console.log("error in adding banner", error);
      res.redirect("/pageError");
   }
}

const deleteBanner = async (req,res)=>{
    try{

      const bannerId = req.params.id;
 
      console.log("bannerId" , bannerId)
      
      await Banner.findByIdAndUpdate(bannerId,{ isDeleted: true});
      
      res.redirect("/admin/banner")

    }
    catch(error){
       console.log("error in deleting banner" , error);
       res.redirect("/pageError")
    }
}

module.exports = { loadBannerPage, addBannerPage , addBanner , deleteBanner }

