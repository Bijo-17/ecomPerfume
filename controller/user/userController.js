
const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer")


const pageNotFound = async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const loadLogin = async (req,res)=>{

  try{
    if(!req.session.user){
   
      return  res.render("login", {message:"", activeTab: "login" });
    } else {
      res.redirect("/")
    } 
  }
  catch(error){
     res.redirect("/pageNotFound")
  } 

           
}

const loadRegister = async (req,res)=>{
    try {
        res.render("login", {message:"", activeTab: "register" });

    } catch (error) {
        conseole.log("error in loadregister",error)
        res.status(500).send("error loading register page")
    }
}

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
            subject:"verify your Accound for Petal & Mist",
            text:`Your OTP is ${otp}`,
            html:`<b> Your OTP ${otp} <b>`,

        })

        return info.accepted.length>0

    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}


      const registerUser = async (req,res)=>{

        const {name, email, phone, password} = req.body
        let hashedPassword;

        try{
               
            const existingUser = await User.findOne({email})
    
            if(existingUser){
              return res.render("login" ,{message:"user already exists", activeTab:"register"})
            }
    
        
    
            const otp = generateOtp();      
            
            const otpExpiry = Date.now() + 60 * 1000; // 1 minute expiry

    
            // const emailSent = await sendVerificationEmail(email,otp)
           
            // if(!emailSent){
            //     return res.json("email.error")
            // }
    
            req.session.userOtp = otp;
            req.session.otpExpiry = otpExpiry;
            req.session.userData = {  name, email, phone, password}
            req.session.email = email
            
            res.render("verifyOtp"  , { message: "OTP sent to your email. Please verify." })

            console.log(`Otp send ${otp}`)
        }
          catch(error){
            console.error("signup error",error)
            res.redirect("/pageNotFound")
          }


        }



        const verifyOtp = async (req,res)=>{


            const { otp:enteredOtp } = req.body;
            const email = req.session.email

            const { userOtp, otpExpiry, userData } = req.session;

            if (!userOtp || !userData) {
              return res.status(400).json({ success: false, message: "Session expired. Please register again." });
              }

              if (Date.now() > otpExpiry) {
                return res.status(400).json({ success: false, message: "OTP expired. Please resend OTP." });
              }

              if (enteredOtp !== userOtp) {
                return res.status(400).json({ success: false, message: "Incorrect OTP. Try again." });
              }


              try{
                         
                        const {name, email, phone, password} = userData

                        const saltRounds = 10;

                        hashedPassword= await bcrypt.hash(password, saltRounds)

                              
                       const newUser = new User({name, email, phone, password:hashedPassword})
 
                        

                        await newUser.save()

                        

                        req.session.userOtp = null;
                      
                        req.session.otpExpiry = null;
                        req.session.user=newUser._id
                      // console.log("after registeration",req.session, "end")
                        return res.status(200).json({
                          success: true,
                          message: "User registered successfully",
                          redirectUrl: "/"
                        });
   

              }
    
                   catch(error){
                       console.log(error)
                       return res.status(500).json({ success: false, message: "Internal Server Error" })
                   }
           }

           const resendOtp =  async (req, res) => {
            try {
              const { userData } = req.session;
              // const email = req.session.email
              console.log("useData", userData)
          
              if(!userData || !userData.email) 
                {
              
                    return res.render("login" ,{message:"Session expired", activeTab:"register"});
                  }
          
              const otp = generateOtp();
              const otpExpiry = Date.now() + 60 * 1000; 
          
              // const emailSent = await sendVerificationEmail(userData.email, otp);
          
              // if (!emailSent) {
              //   return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again later.' });
              // }
          
              req.session.userOtp = otp;
              req.session.otpExpiry = otpExpiry;
          
              console.log(`Resent OTP: ${otp}`);
            //   return res.render("verifyOtp", {message: "OTP resend successfully" });
              return res.json({ success: true, message: "OTP resent successfully" });
          
            } catch (error) {
              console.error('Error resending OTP:', error);
              res.status(500).json({ success: false, message: 'Server error.' });
            }
          };
          

  const verifyUser = async (req,res)=>{
   
    const {email , password}= req.body
    
    console.log(email,password)
    try{
          const existingUser = await User.findOne({email})
         
          if(existingUser){ 
            
            if(existingUser.isBlocked){
              return res.render("login" , {message : "User is blocked by admin " , activeTab: "login"})
            }


            const pmatch = await bcrypt.compare(password,existingUser.password)
           

            if(!pmatch){   
               return res.status(400).render("login" , {message : "Invalid password " , activeTab: "login"})
            }

           
            req.session.email = email
            req.session.user = existingUser._id;  
            

            res.redirect("/")

          }else{
            return res.status(400).render("login" , {message : "user not found", activeTab: "login"})
          }
         
    }
    catch(error){
        console.log(error)
        res.render("login" , {message : "login failed. Please try again later" , activeTab: "login"})
    }
}

const loadHome = async (req,res)=>{
    try {
      const user = req.session.user
      console.log("session user",user)
     
      if(user){

         // const userData = await User.findOne({_id:user});
        // console.log("userData",userData)
         res.redirect("/home")
         
      }else {
        return res.render("landingPage")
      }

        
        
    } catch (error) {
        console.log("failed to load homePage", error.message)
        res.status(500).send("unable to load server")
        
    }
}

const userHome = async (req,res)=>{
     try {
      
          const user = req.session.user;

           if(user){

        const userData = await User.findOne({_id:user});
        console.log("userData",userData)
        
         res.render("landingPage",{user:userData})
      }else {
        return res.render("landingPage")
      }


     } catch (error) {

       console.log("failed to load homePage", error.message)
        res.status(500).send("unable to load server")
      
     }

}


const logout = async (req,res)=>{
   console.log("req.session",req.session.email)
   
   
   req.session.email=null;
   req.session.user = null;
  
 
  res.redirect("/")
}


module.exports ={
    loadHome,
    pageNotFound,
    loadLogin,
    registerUser,
    verifyUser,
    loadRegister,
    verifyOtp,
    resendOtp,
    userHome,
    logout
}




