const razorpay = require('razorpay')
const User = require("../../models/userSchema")




const razorpayPayment = async (req, res) => {
  try {
    const { amount, addressId } = req.body;

    if (!addressId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_ADDRESS,
      });
    }

    if (!amount) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: MESSAGES.ERROR.INVALID_REQUEST });
    }
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.USER_NOT_FOUND });
    }
    const cart = await Cart.findOne({ userId: userId });

    let subtotal = 0;
    const couponDiscount = req.session.cart?.discount || 0;
    const shippingCost = 50;

    cart.items.map((item) => (subtotal += item.totalPrice));

    const totalAmount = subtotal - couponDiscount + shippingCost;

    const options = {
      amount: totalAmount.toFixed() * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.OPERATION_SUCCESS,
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
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.SOMETHING_WRONG,
      error: error.message,
    });
  }

}