const Banner = require('../../models/bannerSchema');

const loadBannerPage = async (req, res) => {
   try {

       const banner = await Banner.find({isDeleted : false} )
       console.log("banner" , banner)
      res.render('banner' ,{banner})
   }
   catch (error) {
      console.log("error in loading the banner page")
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

      const banner = new Banner({
         title: data.title,
         start_date: data.start_date,
         end_date: data.end_date,
         link: data.link,
         banner_img: '/uploads/images/' + image
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

