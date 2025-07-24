const User = require("../../models/userSchema")
const bcrypt = require("bcrypt")


const loadLogin = async (req,res)=>{
    
   if(req.session.admin){

     return res.redirect("/admin/dashboard")
   }

    res.render("adminLogin", {message:""});
      
}

const verifyAdmin = async (req,res)=>{
  
       const {email, password} = req.body;
       try{
        const admin = await User.findOne({email,isAdmin:true})

     
       
        if(admin){     

          const pmatch = await bcrypt.compare(password,admin.password)
         

          if(!pmatch){   
             return res.render("adminLogin", {message:"Invalid password"});
          }
           
          req.session.admin = true;
          res.redirect("/admin")

        }else{
          res.render("adminLogin", {message:"Login failed"});
        }
       
  }
  catch(error){
      console.log(error)
      res.redirect("/admin")
  }

}

const loadDashboard = async (req,res)=>{
  try{
     if(!req.session.admin){
       return res.redirect("/admin/login")
     }

    res.render("dashboard")
  }
  catch(error){
    res.render("/pageError")
    console.log("error",error)
  }
   
}




const logout = async (req,res)=>{

    req.session.admin = null;
    res.redirect("/admin/login")
}

const pageError = async (req,res)=>{
   res.render("pageError")
}




module.exports = { loadLogin,verifyAdmin , loadDashboard, logout , pageError }