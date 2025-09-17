const Wallet = require("../../models/walletSchema");
const User = require("../../models/userSchema")
const Transaction = require("../../models/transactionSchema")

const getWallet = async (req, res) => {

    try {

        const userId = req.session.user;
        const user = await User.findById(userId)

        const page = parseInt(req.query.page || 1);
        const skip = (page - 1) * 5;

        const wallet = await Wallet.findOne({ user_id: userId }).populate({path:'transaction_id' , options:{sort: {transaction_date : -1}} })
        const walletTransaction = wallet?.transaction_id?.slice( (page-1) * 5 , page * 5);
        const count = wallet?.transaction_id?.length;
     

        res.render("wallet", { 
                               layout: "../layout/userAccount", active: "wallet", 
                               wallet, 
                               user, 
                               currentPage : page, 
                               totalPages : Math.ceil(count/5),
                               transactionHistory : walletTransaction
         })

    } catch (error) {
        console.log("error in loading wallet", error);
        res.redirect("/pageError")
    }

}



module.exports = { getWallet }