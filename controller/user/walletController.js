const Wallet = require("../../models/walletSchema");
const User = require("../../models/userSchema")
const Transaction = require("../../models/transactionSchema")

const getWallet = async (req, res) => {

    try {

        const userId = req.session.user;
        const user = await User.findById(userId)
        const wallet = await Wallet.findOne({ user_id: userId }).populate('transaction_id')
        const transaction = await Transaction.find({ user_id: user._id }).sort({ transaction_date: -1 })

        res.render("wallet", { layout: "../layout/userAccount", active: "wallet", wallet, user, transaction })

    } catch (error) {
        console.log("error in loading wallet", error);
        res.redirect("/pageError")
    }

}



module.exports = { getWallet }