const Order = require("../../models/orderSchema")
const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Wallet = require("../../models/walletSchema")
const Transaction = require("../../models/transactionSchema")



const getOrders = async (req, res) => {

    try {

        const searchQuery = String(req.query.search || '').trim();
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit
        const filter = {}
        const status = req.query.status || '';



        if (searchQuery) {

            const user = await User.find({ name: { $regex: searchQuery, $options: "i" } })
            const userId = user.map(u => u._id)

            const product = await Product.find({ product_name: { $regex: searchQuery, $options: "i" } });
            const product_id = product.map(p => p._id)

            filter.$or = [

                { user_id: { $in: userId } },
                { 'order_items.product_id': { $in: product_id } }


            ]

        }

        if (status && status !== 'all') {
            filter['order_items.order_status'] = status;
        }



        let order = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('user_id order_items.product_id')

        const count = await Order.countDocuments(filter)
        const totalPages = Math.ceil(count / limit)



        res.render("orderListAdmin", { searchQuery, orders: order, totalPages, currentPage: page, status })



    } catch (error) {
        console.log("error in loading order list", error)
        res.redirect("/admin/pageError")
    }


}


const orderDetails = async (req, res) => {

    try {

        const { orderId, productId } = req.params

        const order = await Order.findById(orderId).populate('order_items.product_id address_id user_id');

        const currentProduct = order.order_items.find(product => product._id == productId)


        res.render("detailedOrderPage", { order })

    } catch (error) {
        console.log("error in loading detailed order page", error)
        res.redirect("/admin/pageError")
    }



}



const cancelReturn = async (req, res) => {


    try {

        const userId = req.session.user;
        const productId = req.params.productId;
        const orderId = req.params.orderId

        let order = await Order.findOne({ _id: orderId }).populate('order_items.product_id')

        const currentItem = order.order_items.find(product => product.product_id._id == productId)

        currentItem.return_request.status = 'rejected';

        await order.save()


        res.status(200).json({ success: true })

    } catch (error) {
        console.log("error in cancellinig return ", error)
        res.status(400).json({ success: false })
    }


}


const approveReturn = async (req, res) => {

    try {


        const productId = req.params.productId;
        const orderId = req.params.orderId

        let order = await Order.findOne({ _id: orderId }).populate('order_items.product_id')

        const userId = order.user_id;

        const returnedItem = order.order_items.find(product => product.product_id._id == productId)


        const { product_price, delivery_charge, quantity } = returnedItem;

        const refundAmount = parseFloat((quantity * product_price) + delivery_charge - (order.discount / order.order_items.length));


        returnedItem.return_request.status = 'approved';
        returnedItem.order_status = 'returned';

        await order.save()


        const product = await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity }, stock_status: true }, { new: true })

        const wallet = await Wallet.findOneAndUpdate({ user_id: userId }, { $inc: { balance: refundAmount } })
        const user = await User.findById(userId)

        if (!wallet) {

            const walt = await new Wallet({
                user_id: userId,
                balance: refundAmount
            }).save()


            await User.findByIdAndUpdate(userId, { wallet: walt._id })
        }


        const transaction = await Transaction.findOne({ user_id: userId })

        if (!transaction) {
            const trans = await new Transaction({
                amount: refundAmount,
                transction_date: new Date(),
                order_id: order._id,
                user_id: user._id,
                status: 'credited'
            }).save()

            await Wallet.findByIdAndUpdate(wallet._id, { transaction_id: trans._id })

        } else {

            await Transaction.findOneAndUpdate({ user_id: userId }, { amount: refundAmount, status: 'credited' })

        }

        res.status(200).json({ success: true })



    } catch (error) {

        console.log("error in accepting return ", error)
        res.status(500).json({ success: false })

    }



}


const updateOrderStatus = async (req, res) => {

    try {


        const productId = req.params.productId;
        const orderId = req.params.orderId;
        const status = req.body.status;


        let order = await Order.findOne({ _id: orderId }).populate('order_items.product_id')

        order.order_status = status
        if (order.order_status === 'delivered') {
            order.delivered_date = new Date()
        }
        const currentItem = order.order_items.find(product => product.product_id._id == productId)

        currentItem.order_status = status;


        await order.save()

        res.redirect("/admin/orderList")

    } catch (error) {

        console.log("error in updating order status", error)
        res.status(400).json({ success: false })

    }

}



module.exports = { getOrders, orderDetails, cancelReturn, approveReturn, updateOrderStatus }