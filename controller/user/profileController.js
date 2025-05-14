
const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const session = require("express-session")
const Address = require("../../models/addressSchema")


function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

async function sendVerificationEmail(email,otp){
    try {
         
        const transporter =nodemailer.createTransport({

            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({

            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Recover your Accound for Petal & Mist",
            text:`Your OTP is ${otp}`,
            html:`<b> Your OTP ${otp} <b>`,

        })

        return info.accepted.length>0

    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}    


const loadPasswordReset = async (req,res)=>{

    try {
        
        res.render("forgotPassword",{message:""})

    } catch (error) {
        console.log(error)
    }
}


const resetPassword = async (req,res)=>{

   try {
      
    const {email} = req.body;
    
    const user = await User.findOne({email})
    console.log("user",user)

    if(user){
        const otp = generateOtp();
        const otpExpiry = Date.now() + 60 * 1000; // 1 minute expiry
        // const emailSent = await sendVerificationEmail(email,otp)

         req.session.userOtp = otp;
        req.session.otpExpiry = otpExpiry;
        req.session.email = email

      

        // if(emailSent){

        // req.session.userOtp = otp;
        // req.session.otpExpiry = otpExpiry;
        // req.session.email = email
        
        res.render("otpForgotPassword" )

        console.log(`Otp send ${otp}`)

        // }else{
        //     res.json({success:false, message: "Failed to send otp. Please try again"})
        // }
    }
    else {
        return res.render("forgotPassword",{message: "user not found ITS YOU"})
    }
    
   } catch (error) {
       
    console.log(error)
    res.redirect("/pageNotFound")
    
   }

}


const  verifyOtp = async (req,res)=>{

    try {

        const {enteredOtp} = (req.body);
        console.log("req.body",req.body)
        const otp = req.session.userOtp;
        const email = req.session.email;
        const otpExpiry = req.session.otpExpiry
        console.log(enteredOtp)
        console.log(otp)

        if(!otp || !email){
           return res.render("forgotPassword",{message:"session expired"})
        } 

        if (Date.now() > otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP expired. Please resend OTP." });
          }
        
        if(otp !== enteredOtp ){ 
         return res.status(400).json({success:false,message:"otp donot match"})
       }
        
       res.status(200).json( {success:true,message:"otp verification sucessfull"})
      
        
    } catch (error) {
        console.log(error)
        res.redirect("/pageNotFound")
    }
}

const resendOtp = async (req,res)=>{
 
    try{
    if(!req.session.email){
        return res.render("forgotPassword",{message:"session expired"})
    }
 
   const otp = generateOtp();
    const otpExpiry = Date.now() + 60 * 1000;

    console.log("resend",otp)

    req.session.otp = otp;
    req.session.otpExpiry = otpExpiry;
    
    res.status(200).json({ success:true, message:"OTP send sucessfully" })
}
catch(error){
   res.status(500).json({sucess:false , message:"Unable to send OTP , please try again"})
   console.log("otp send failed",error)
}


}

const newPasswordPage = async (req,res)=>{
    res.render("resetPassword",{message:""})
}


const SaveNewPassword = async (req,res)=>{
    try{
         const {password , cPassword} = req.body;
         const email = req.session.email;

         console.log("email save password ", email)
         console.log(password,cPassword)

         if(!email){
           return  res.render("forgotPassword",{message:"session expired"})
         }

         if (password !== cPassword) {
            return res.render("resetPassword", { message: "Passwords do not match" });
          }

          const saltRounds = 10;

          const hashedPassword = await bcrypt.hash(password,saltRounds)

             
           const updateUser = await User.findOneAndUpdate({email},{$set:{password:hashedPassword}},{new:true})

           if(!updateUser){
            return res.render("forgotPassword", { message: "Unable to reset password" });
           }

           

           return res.render("login", { message: "Password updated successfully", activeTab: "login" });

         

       
           

    }
    catch(error){
        console.error("Password reset error:", error);
        return res.status(500).render("resetPassword", { message: "Server error. Please try again." });
    }


}

    const loadAccount =  async (req,res)=>{
            
        
        try {

            if(!req.session.user ) {
                return res.redirect("/login")       
            }
                const user = await User.findOne({_id:req.session.user})

                console.log("///staaarted\n",user,"\n///ended")
                
                if(!user){
                return res.redirect("/login")       
                } else {
                

                const [firstName = "" , lastName = "" ] = (user.name || "" ).split(' ')

                res.render("account",{layout:"../layout/userAccount", active:"account", user, firstName , lastName})
                }

        } catch (error) {
            
            res.status(500).json("error")

        }

    
    }


const editAccount = async (req,res)=>{
 
      try {

        const email = req.session.email;
        if (!email) return res.redirect("/login");

        const user = await User.findOne({ email });
        if (!user) return res.redirect("/login");

        const { firstName, lastName, dob, gender, city, state, houseName, pincode } = req.body;

        console.log("edited details: ",req.body)

      
        user.fullName = `${firstName} ${lastName}`;
        user.dob = dob;
        user.gender = gender;
        // user.address = address._id;

        if (user.address) {
            // Address already exists — update it
            await Address.findByIdAndUpdate(user.address, {
             houseName, city, state, pincode
            });
          } else {
            // No address yet — create new
            const newAddress = new Address({ houseName, city, state, pincode });
            await newAddress.save();
            user.address = newAddress._id;
          }

        await user.save()

        res.redirect('/account');
        
      } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
      }



}







module.exports = { loadPasswordReset, 
                    resetPassword, 
                    verifyOtp , 
                   SaveNewPassword , 
                   loadAccount , 
                   editAccount,
                resendOtp ,
            newPasswordPage }