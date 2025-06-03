const User = require("../../models/userSchema");

const customerInfo = async (req,res)=>{
    try {
        
        let search="";
        if(req.query.search){
            search=req.query.search
        }
        let page=1;
        if(req.query.page){
            
            page=parseInt(req.query.page);
           
        }
       const limit = 5;
       const userData = await User.find({
        isAdmin:false,
        $or:[
            {name: {$regex:".*" + search + ".*"}},  
            {email: {$regex:".*" + search + ".*"}},
        ]
       })
       .sort({createdOn:-1})
       .limit(limit*1)
       .skip((page-1)*limit)
       .exec();

       const count = await User.find({
        isAdmin:false,
        $or:[
            {name: {$regex:".*" + search + ".*"}},
            {email: {$regex:".*" + search + ".*"}},
        ]
       }).countDocuments();

       res.render('customers',{
        data:userData,
        totalPages:Math.ceil(count/limit),
        currentPage:page,
        search
       })


    } catch (error) {
        res.redirect("/pageError")
        console.log("error reading cutomer details",error)
    }
}

const customerBlocked = async (req,res)=>   {
   try {
    let id = req.query.id;
    await User.updateOne({_id:id}, {$set:{isBlocked:true}});
    req.session.user=null;
    res.redirect("/admin/users")
    
   } catch (error) {
    res.redirect("/pageError")
    
   }
}

const customerUnblocked = async (req,res)=>   {
    try {
     let id = req.query.id;
     await User.updateOne({_id:id}, {$set:{isBlocked:false}});
     res.redirect("/admin/users")
     
    } catch (error) {
     res.redirect("/pageError")
     
    }
 }

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
}