const Wallet = require("../../models/walletSchema");
const User = require("../../models/userSchema")

const getWallet = async (req,res)=>{

    try {

        const userId = req.session.user;
console.log("userid",userId)
         
        const user = await User.findById(userId)
          const wallet = await Wallet.findOne({user_id:userId})

        console.log("wallet",wallet)
 
            res.render("wallet",{layout:"../layout/userAccount", active:"wallet", wallet ,user })


    } catch (error) {
        console.log("error in loading wallet",error);
        res.redirect("/pageNotFound")
    }


}





module.exports = {getWallet}