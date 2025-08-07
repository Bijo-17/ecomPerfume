
const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const jwt = require('jsonwebtoken');
const Coupon = require("../../models/couponSchema");
const Cart = require("../../models/cartSchema");
const Banner = require("../../models/bannerSchema");
const { dash } = require("pdfkit");

const pageNotFound = async (req,res)=>{
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageError")
    }
}

const pageError = async (req,res)=>{
   try{
         res.render("server-error")
   }
   catch(error){
          res.render("server-error")
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

      const refId = req.query.ref;

      req.session.ref = refId
        res.render("login", {message:"", activeTab: "register" });

    } catch (error) {
        conseole.log("error in loadregister",error)
        res.status(500).redirect("/pageError")
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
               
            const existingUser = await User.findOne({email ,isDeleted:false})
    
            if(existingUser){
              return res.render("login" ,{message:"user already exists", activeTab:"register"})
            }
    
        
    
            const otp = generateOtp();      
            
            const otpExpiry = Date.now() + 60 * 1000; // 2 minute expiry

    
            const emailSent = await sendVerificationEmail(email,otp)
           
            if(!emailSent){
                return res.json("email.error")
            }
    
            req.session.userOtp = otp;
            req.session.otpExpiry = otpExpiry;
            req.session.userData = {  name, email, phone, password}
            req.session.email = email
            
            res.render("verifyOtp"  , { message: "OTP sent to your email. Please verify." })

            console.log(`Otp send ${otp}`)
        }
          catch(error){
            console.error("signup error",error)
            res.redirect("/pageError")
          }


        }



        const verifyOtp = async (req,res)=>{


            const { otp:enteredOtp } = req.body;
           

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

               // check for refrals 

                     const referralToken = req.session.ref;

                

                    let referrerId = null;

                 if (referralToken) { 
                  
                       const decoded = jwt.verify(referralToken, process.env.JWT_SECRET);
                       referrerId = decoded.referrerId;
                  
          
                  }

       let referredUser = await User.findById(referrerId)

    

       let offer_price = 40;

  
     
       if(referredUser && (referredUser.referredUsers.length+1) % 5 === 0 && referredUser.referredUsers.length !==0){
         
                  offer_price = 100;
               

       }

        if (referrerId) {
            // Generate and assign a coupon to the referrer
            const randomNum = Math.floor(100 + Math.random() * 900);
            const coupon = new Coupon({
              coupon_name : `Ref-user${randomNum}`, 
                user_id: referrerId,
                coupon_type: 'referal',
                code: `REF${Date.now()}`,
                 offer_price,
                 minimum_price : 500,
                expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            await coupon.save();
            
            await User.findByIdAndUpdate(referrerId ,{ $push: {referredUsers: {user_id: newUser._id,coupon_id:coupon._id}},$inc:{referralEarnings: offer_price}})
        }

                        

                        req.session.userOtp = null;
                      
                        req.session.otpExpiry = null;
                        req.session.user=newUser._id
                   
                        return res.status(200).json({
                          success: true,
                          message: "User registered successfully",
                          redirectUrl: "/"
                        });
   

              }
    
                   catch(error){
                       console.log(error)
                       return res.status(500).json({ success: false, message: "Registration failed, Try again later" })
                   }
           }

           const resendOtp =  async (req, res) => {
            try {
              const { userData } = req.session;
            
            
          
              if(!userData || !userData.email) 
                {
              
                    return res.render("login" ,{message:"Session expired", activeTab:"register"});
                  }
          
              const otp = generateOtp();
              const otpExpiry = Date.now() + 60 * 1000; 
          
              const emailSent = await sendVerificationEmail(userData.email, otp);
          
              if (!emailSent) {
                return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again later.' });
              }
          
              req.session.userOtp = otp;
              req.session.otpExpiry = otpExpiry;
          
              console.log(`Resent OTP: ${otp}`);
         
              return res.status(200).json({ success: true, message: "OTP resent successfully" });
          
            } catch (error) {
              console.error('Error resending OTP:', error);
              res.status(500).json({ success: false, message: 'Server error.' });
            }
          };
          

  const verifyUser = async (req,res)=>{
   
    const {email , password}= req.body
    
   
    try{
          const existingUser = await User.findOne({email})
         
          if(existingUser){ 
            
         

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
        console.log("error in verifying user" ,error)
        res.render("login" , {message : "login failed. Please try again later" , activeTab: "login"})
    }
}

const loadHome = async (req,res)=>{

       try {
      
          const user = req.session.user;
          const currentDate = new Date()
          currentDate.setHours(23,59,59,999)
       

          const product = await Product.find({isDeleted:false}).sort({createdAt:-1}).populate('category_id').exec()

          const banner = await Banner.find({ 
                                                isDeleted:false , 
                                                status:true,
                                                start_date:{$lte: new Date().setHours(23,59,59,999)},
                                           $or : [                                       
                                                    {end_date:{ $gte: new Date().setHours(0,0,0,0)}} ,
                                                    {end_date: { $exists:false}},
                                                    {end_date: null }
                                                 ]
                                           }).sort({createdAt:-1})

                        
           const category = await Category.find({isDeleted:false})

           if(user){

            return res.redirect("/home")
      }else {
        return res.render("landingPage",{product , banner , category })
      }
        
        
    } catch (error) {
        console.log("failed to load homePage", error.message)
        return res.redirect("/pageError")
        
    }
}

const userHome = async (req,res)=>{
     try {
      
          const user = req.session.user;
          const product = await Product.find({isDeleted:false}).sort({createdAt:-1}).populate('category_id').exec()
          const banner = await Banner.find({ 
                                                isDeleted:false , 
                                                status:true,
                                                start_date:{$lte: new Date().setHours(23,59,59,999)},
                                           $or : [                                       
                                                    {end_date:{ $gte: new Date().setHours(0,0,0,0)}} ,
                                                    {end_date: { $exists:false}},
                                                    {end_date: null }
                                                 ]
                                           }).sort({createdAt:-1})

          const category = await Category.find({isDeleted:false})
           if(user){ 

        const userData = await User.findOne({_id:user});
        const cart = await Cart.findOne({user_id:user})
        
         res.render("landingPage",{user:userData ,product , cart , banner ,category})
      }else {
        return  res.redirect("/")
        //  res.render("landingPage" , {banner , category , category})
      }


     } catch (error) {

       console.log("failed to load homePage", error.message)
        res.status(500).redirect("/pageError")
      
     }

}


const logout = async (req,res)=>{
  
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
    logout,
    pageError
}




