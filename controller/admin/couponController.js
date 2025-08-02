const Coupon = require("../../models/couponSchema")


const getCoupon = async (req, res) => {

    try {

        const coupon = await Coupon.find()

        const date = new Date()
        date.setHours(0,0,0,0)

        console.log("date" ,date)

        for (let c of coupon) {
            if (c.expiry_date && c.expiry_date < date) {
                console.log(c.expiry_date , date , "date")
                c.isActive = false
                await c.save();
            }
        };

        


        res.render("coupon", { coupon })

    } catch (error) {

        console.log("Error in loading coupon page ", error)
        res.redirect("/admin/pageError")
    }


}

const createCoupon = async (req, res) => {
    try {

        const { couponName, startDate, endDate, offerPrice, minimumPrice, couponType, maxDiscount } = req.body.formData

        const existingCoupon = await Coupon.findOne({ coupon_name: { $regex: `^${couponName}$`, '$options': 'i' }})

        if (existingCoupon) {
            return res.status(400).json({ success: false, message: "Coupon already exists!" })
        }

        const coupon = new Coupon({
            coupon_name: couponName,
            start_date: startDate,
            expiry_date: endDate,
            offer_price: offerPrice,
            minimum_price: minimumPrice,
            discount_type: couponType,
            max_discount: maxDiscount
        })

        await coupon.save()

        res.status(200).json({ success: true })


    } catch (error) {
        console.log("error in creating coupon", error)
        res.status(500).json({ success: false, message: "Server error" + error.message })
    }
}


const deleteCoupon = async (req, res) => {
    try {

        const couponId = req.query.id;

        if (!couponId) {
            return res.status(400).json({ message: "coupon not found" })
        }

        await Coupon.findByIdAndDelete(couponId)

        res.status(200).json({ message: "Coupon deleted successfully" })


    } catch (error) {
        console.log("error in creating coupon", error)
        res.status(500).json({ message: "internal server error" })

    }
}

const editCoupon = async (req, res) => {

    try {

        const data = req.body;
        const couponId = req.body.couponId

        const value = req.body.isActive
        data.isActive = req.body.isActive === "true";

        if (data.discount_type === 'fixed') {
            data.max_discount = null;
        }

        await Coupon.findByIdAndUpdate(couponId, data)

        res.redirect("/admin/coupon")


    } catch (error) {

        console.log("error in editing coupon", error)
        res.redirect("/admin/pageError")
    }
}



module.exports = { getCoupon, createCoupon, deleteCoupon, editCoupon }