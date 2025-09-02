const Razorpay = require('razorpay')
const User = require("../../models/userSchema")
const env = require('dotenv').config()
const Cart = require("../../models/cartSchema")
const crypto = require("crypto");
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Address = require("../../models/addressSchema")
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema")
const Transaction = require("../../models/transactionSchema")
const { parse } = require('url');
const { json } = require('stream/consumers');
const { addAddressCheckout } = require('./addressController');
const mongoose = require('mongoose')
const Varients = require("../../models/varientsSchema");
const varientsSchema = require('../../models/varientsSchema');


function generateOrderId() {
  const prefix = "#ORD";
  const timestamp = Date.now(); // milliseconds since epoch
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${prefix}-ID${timestamp}-${randomNum}`;
}


async function updateProductStock(productId, quantityPurchased, volume) {
  try {
    const varient = await Varients.findOne({ product_id: productId });

    let status;
    varient.inventory.forEach(item => {

      if (item.volume === volume) {

        if (item.stock >= quantityPurchased) {

          item.stock -= quantityPurchased
          status = true;

        } else {
          status = false;
        }

      }

    })


    await varient.save();

    return status;


  }
  catch (error) {
    console.log("error in updating the product stock", error);
    return false;
  }

}



const saveNewAddress = async (addressId, isTypedAddress, saveAddress, fullDetails, order, userId) => {
  try {


    let address = {}
    let orderAddress;



    if (!isTypedAddress) {

      if (!addressId) {

        return null;
      }

      address = await Address.findOne({ _id: addressId, user_id: userId });

      if (!address) {

        return null;
      }
      order.temp_address = null;
      return address._id;

    }


    if (saveAddress) {

      orderAddress = new Address(fullDetails)

      await orderAddress.save()



      order.temp_address = null;

      return orderAddress._id;

    } else {

      order.temp_address = {
        _id: new mongoose.Types.ObjectId(),
        name: fullDetails.name,
        phone_number: fullDetails.phone_number,
        address_name: fullDetails.address_name,
        locality: fullDetails.locality,
        city: fullDetails.city,
        state: fullDetails.state,
        pin_code: fullDetails.pin_code,
        address_type: fullDetails.address_type
      };

      return null;

    }


  } catch (error) {
    console.log('error in saving address ', error)
    return null;
  }
}


const placeOrder = async (req, res) => {

  try {

    const { addressId } = req.body;
    const fullDetails = req.body;
    const userId = req.session.user;
    let total = parseFloat(req.session.total);

    if (req.session.couponApplied) {
      total = Number(total - req.session.discount)
    }

    const paymentMethod = req.body.paymentMethod;

    if (paymentMethod === 'cod' && total > 1000) {
      return res.status(400).json({ success: false, message: "Cash on delivery is not allowed for order above 1000" })
    }


    fullDetails.user_id = userId;

    const order_items = req.session.validatedCart;

    const isTypedAddress = req.body.isTypedAddress;

    const saveAddress = req.body.saveForFuture;

    const delivery = req.session.delivery;



    // save address 

    let order = {};

    const saveAddressDb = await saveNewAddress(addressId, isTypedAddress, saveAddress, fullDetails, order, userId)



    if (!saveAddressDb && !order.temp_address) {
      return res.status(500).json({ success: false, message: "error in saving address" })
    }



    if (!order_items) {
      return res.status(400).json({ success: false, message: "Product not found" })
    }

    let orderedProducts = []
    const orderId = generateOrderId();

    let couponDiscount = 0

    if (req.session.coupon) {
      couponDiscount = req.session.discount || 0;

    }


    let payment_method = { method: "cod", status: "unpaid" }
    let isPaid = false;

    if (paymentMethod === 'wallet') {

      const wallet = await Wallet.findOne({ user_id: userId })

      const walletBalance = wallet?.balance || 0

      if (walletBalance < total) {
        return res.status(400).json({ success: false, message: "Insufficient balance" })
      }


      wallet.balance -= total;

      await wallet.save()

      payment_method = { method: 'wallet', status: 'paid' }
      isPaid = true

    }

    // saving the order and updating  the product

    for (let product of order_items.items) {

      const productFound = await Product.findOne({ _id: product.product_id._id })

      if (productFound) {

        // update quantity    

        const updateStatus = await updateProductStock(product.product_id._id, product.quantity, product.volume);

        if (!updateStatus) return res.status(400).json({ success: false, message: `Not enough stock available for ${product.product_id.product_name}` })


        orderedProducts.push({
          product_id: product.product_id._id,
          quantity: product.quantity,
          product_price: product.sales_price,
          delivery_charge: delivery,
          volume: product.volume
        });




      } else {
        return res.status(400).json({ sucess: false, message: "Product not found , Please check the cart again" })
      }

    }


    // save coupon to user
    if (req.session.coupon) {
      const coupon = await Coupon.findById(req.session.coupon)
      await User.findByIdAndUpdate(userId, { $push: { applied_coupons: coupon._id } })
    }


    await Cart.updateOne({ user_id: userId }, { $set: { items: [], applied_coupon: null } });


    const newOrder = new Order({
      user_id: req.session.user,
      coupon_id: req.session.coupon || null,
      address_id: saveAddressDb || null,
      temp_address: order?.temp_address || null,
      order_status: 'pending',
      order_date: new Date(),
      total_price: total,
      order_items: orderedProducts,
      order_id: orderId,
      discount: couponDiscount || 0,
      payment_method,
      isPaid,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      delivery_charge : delivery
    });

    await newOrder.save();

    if (paymentMethod === 'wallet') {

     const transaction =  new Transaction({
        user_id: userId,
        status: 'debited',
        amount: total,
        order_id: newOrder._id,
        transaction_date : new Date()

      })

      await transaction.save();

      await Wallet.findOneAndUpdate({user_id : userId}, {$push : {transaction_id : transaction._id }})

    }


    req.session.orderId = orderId;

    res.json({ success: true });




  } catch (error) {
    console.log("error in placing order", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}



const razorpayPayment = async (req, res) => {
  try {

    const order_items = req.session.validatedCart;

    if (!order_items) {
      return res.status(400).json({ success: false, message: "Product not found" })
    }

    const delivery = req.session.delivery;
    let orderedProducts = []
    let outOfStock = false;

    for (let product of order_items.items) {

      const productFound = await Product.findOne({ _id: product.product_id._id })

      if (productFound) {

        const varient = await Varients.findOne({ product_id: product.product_id._id })

        varient.inventory.forEach(item => {

          if (product.volume === item.volume && item.stock < product.quantity) {
            outOfStock = true;
            return res.status(400).json({ success: false, message: `Not enough stock available for ${product.product_id.product_name}` })
          }
        })

       if(outOfStock){ 
          return;
       }

        orderedProducts.push({
          product_id: product.product_id._id,
          quantity: product.quantity,
          product_price: product.sales_price,
          delivery_charge: delivery,
          volume: product.volume
        });



      } else {
        return res.status(400).json({ sucess: false, message: "Product not found , Please check the cart again" })
      }

    }



    let amount = req.session.total;

    if (req.session.couponApplied) {
      amount = Number(amount - req.session.discount)
    }



    if (!amount) {
      return res
        .status(400)
        .json({ success: false, message: "invalid request" });
    }

    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "user not found" });
    }
    const cart = await Cart.findOne({ userId: userId });


    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });



    const options = {
      amount: parseInt(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);


    // saving the order

    const { addressId } = req.body;
    const fullDetails = req.body;

    fullDetails.user_id = userId;

    const isTypedAddress = req.body?.isTypedAddress;

    const saveAddress = req.body?.saveForFuture;


    let total = parseFloat(req.session.total).toFixed(2);

    // save address 

    let orders = {};

    const saveAddressDb = await saveNewAddress(addressId, isTypedAddress, saveAddress, fullDetails, orders, userId)

    if (!saveAddressDb && !orders.temp_address) {
      return res.status(500).json({ success: false, message: "error in saving address" })
    }

    const orderId = generateOrderId();


    let couponDiscount = 0;
    if (req.session.coupon) {


      couponDiscount = req.session.discount;
    }



    const newOrder = new Order({
      user_id: req.session.user,
      coupon_id: null,
      address_id: saveAddressDb || null,
      temp_address: orders?.temp_address || null,
      order_status: 'failed',
      order_date: new Date(),
      total_price: total,
      order_items: orderedProducts,
      order_id: orderId,
      discount: couponDiscount,


      payment_method: {
        method: "online",
        status: "pending",
      }
    });

    await newOrder.save();


    req.session.orderId = orderId;



    return res.status(200).json({
      success: true,
      message: "SUCCESS.OPERATION_SUCCESS",
      key: process.env.RAZORPAY_KEY_ID,
      order: order,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
      error: error.message,
    });
  }

}



const verifyRazorpayPayment = async (req, res) => {


  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payload,
    } = req.body;

    const userId = req.session.user;
    const order_items = req.session.validatedCart;

    const cart = await Cart.findOne({ user_id: userId })

    const orderId = req.session.orderId;

    await Order.findOneAndUpdate({ order_id: orderId }, {
      payment_method: {

        method: 'online',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,

      },
      isPaid: 'false',

    })



    // Step 1: Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Step 2: Get user and cart

    const user = await User.findById(userId);


    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not Found.",
      });
    }

    for (let product of order_items.items) {

      const productFound = await Product.findOne({ _id: product.product_id._id })

      if (productFound) {

        // update quantity    

        const updateStatus = await updateProductStock(product.product_id._id, product.quantity, product.volume);

        if (!updateStatus) return res.status(400).json({ success: false, message: `Not enough stock available for ${product.product_id.product_name}` })

      } else {
        return res.status(400).json({ success: false, message: 'product not available' })
      }

    }

    const order = await Order.findOne({ order_id: orderId }).populate('order_items.product_id');



    //  adding coupon to user if present

    if (cart.applied_coupon.code) {
      const amount = Number(order.total_price - cart.applied_coupon.discountAmount).toFixed(2)
      await User.findByIdAndUpdate(userId, { $push: { applied_coupons: cart.applied_coupon.code } })
      await Order.findOneAndUpdate({ order_id: orderId }, { $set: { coupon_id: cart.applied_coupon.code, total_price: amount } })

    }


    await Cart.updateOne({ user_id: userId }, { $set: { items: [], applied_coupon: null } }); // Clear cart  



    return res.status(200).json({
      success: true,
      message: "Order placed successfully after payment verification.",
      orderId,
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


const retryPayment = async (req, res) => {
  try {

    const orderId = req.body.orderId

    const retryOrder = await Order.findOne({ order_id: orderId })


    if (!retryOrder) {
      return res.status(400).json({ message: 'Order not found ' });
    }

    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!userId) {
      return res.status(400).json({ message: "Please login!" })

    }

    const validatedCart = {};

    validatedCart.items = [];

    let outOfStock = false;

    for (let item of retryOrder.order_items) {

      const varient = await Varients.findOne({ product_id: item.product_id });

      const product = await Product.findOne({ _id: item.product_id })

      varient.inventory.forEach(element => {
        if (element.volume === item.volume) {

          if (item.quantity > element.stock) {
            outOfStock = true;

          }

          validatedCart.items.push({
            product_id: product,
            quantity: item.quantity,
            volume: item.volume,
            sales_price: element.sales_price,
            stock: element.stock
          })
        }
      })

    }


    if (outOfStock) {

      return res.status(400).json({ message: `Not enough stock available, Please add product to cart and try again` })
    }




    const cart = await Cart.findOne({ user_id: userId })

    let amount = retryOrder.total_price;

    if (cart.applied_coupon.code) {
      amount = Number(amount - cart.applied_coupon.discountAmount)
    }



    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });



    const options = {
      amount: parseInt(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    req.session.orderId = retryOrder.order_id;

    req.session.validatedCart = validatedCart;

    return res.status(200).json({
      success: true,
      message: "SUCCESS.OPERATION_SUCCESS",
      key: process.env.RAZORPAY_KEY_ID,
      order: order,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });



  } catch (error) {

    console.log("error occured in retrying payment ", error)
    return res.status(500).json({ message: 'Server error in retrying payment' + error.message })
  }
}



const applayCoupon = async (req, res) => {
  try {

    req.session.couponApplied = false;
    const userId = req.session.user;
    const user = await User.findById(userId).populate('applied_coupons')
    let { discountCoupon } = req.body;

    let total = req.session.total
    const coupon = await Coupon.find()

    let discount = 0;

    let isCouponApplied = user.applied_coupons.find(c => c.coupon_name.toLowerCase() === discountCoupon.toLowerCase())

    if (isCouponApplied) {
      return res.status(400).json({ message: "Coupon already applied", total, discount })
    }


    if (!coupon) {
      return res.status(400).json({ message: "No coupon available" })
    }

    if (coupon.status === false) {
      return res.status(400).json({ message: "Coupon unavailable", total, discount })
    }


    for (let c of coupon) {

      if (c.coupon_name.toLowerCase() === discountCoupon.toLowerCase()) {

        if (total > c.minimum_price) {



          if (c.discount_type === 'percentage') {
            discount = parseFloat((total * c.offer_price) / 100);
            discount = discount > c.max_discount ? c.max_discount : discount;
            total = parseFloat(total - discount);
          } else {
            total = parseFloat(total - c.offer_price);
            discount = parseFloat(c.offer_price);
          }
          
          await Cart.findOneAndUpdate({ user_id: userId }, { $set: { applied_coupon: { code: c._id, discountAmount: discount } } })
          req.session.coupon = c._id;
          req.session.discount = discount;
          req.session.couponApplied = true;
          return res.status(200).json({ message: 'success', total, discount, coupon_name: c.coupon_name.toUpperCase() })

        } else {

          req.session.couponApplied = false;
          req.session.coupon = null;
          return res.status(400).json({ message: 'Coupon applicable for order above' + c.minimum_price, total, discount })
        }

      }

    }
    req.session.couponApplied = false;
    req.session.coupon = null;
    return res.status(400).json({ message: "invalid coupon", total, discount })



  } catch (error) {
    console.log("error in applaying the coupon", error);
    res.status(500).json({ message: "internal server error", error })

  }
}


const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    req.session.coupon = null;
    req.session.discount = null;
    req.session.couponApplied = false;
    await Cart.findOneAndUpdate({ user_id: userId }, { $set: { applied_coupon: null } })
    res.status(200).json({ success: true })


  } catch (error) {
    res.state(500).json({ success: false, message: "Server error while removing coupon" })

  }
}





module.exports = { razorpayPayment, verifyRazorpayPayment, placeOrder, applayCoupon, removeCoupon, retryPayment }