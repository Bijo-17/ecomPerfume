
const User = require('../../models/userSchema')
const jwt = require('jsonwebtoken');

const getReferral=async (req, res) => {
    const userId = req.session.user; 

    const user = await User.findById(userId).populate('referredUsers.user_id referredUsers.coupon_id')

    if (!user) {
        return res.status(401).redirect("/")
    }

    const referralToken = jwt.sign(
        { referrerId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    const referralLink = `petalandmist.shop/register?ref=${referralToken}`;
    res.render("referAndEarn", { layout:"../layout/userAccount", active:"refer",user, referralLink });
};

module.exports = { getReferral }

