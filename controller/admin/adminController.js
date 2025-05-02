const User = require("../../models/userSchema")
const bcrypt = require("bcrypt")


const loadLogin = async (req,res)=>{
    
   
    res.render("adminLogin", {message:""});

       

       
}

const verifyAdmin = async (req,res)=>{
  
       const {email, password} = req.body;
       try{
        const admin = await User.findOne({email,isAdmin:true})

        console.log(admin)
       
        if(admin){     

          const pmatch = await bcrypt.compare(password,admin.password)
         

          if(!pmatch){   
             return res.render("adminLogin", {message:"Invalid password"});
          }

          res.send("sucess welcome back")

        }else{
          res.render("adminLogin", {message:"Login failed"});
        }
       
  }
  catch(error){
      console.log(error)
  }

}

module.exports = { loadLogin,verifyAdmin }