
const ContactMessage = require('../../models/contactMessageSchema')

const contactUs = async (req,res)=>{
  
    res.render("contactUs")
}

 const contactUsMessage = async (req,res)=>{
     try {

        const details = req.body;

        console.log(details)
         await new ContactMessage({
                                      name: details.name,
                                      email: details.email,
                                      subject: details.subject,
                                      message: details.message
                                  }).save()

         res.redirect("/contact-us");

     } catch (error) {
       console.log("error in saving contact message" , error)
       res.redirect("/pageError")
     }
 }

const aboutUs = async (req,res)=>{
  
    res.render("aboutUs")
}

const privacyPolicy = async (req,res)=>{
  
    res.render("privacyPolicy")
}

const termsAndCondition = async (req,res)=>{
  
    res.render("termsAndConditions")
}


module.exports = { contactUs , aboutUs , privacyPolicy , termsAndCondition , contactUsMessage }