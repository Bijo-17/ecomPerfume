
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require('../../models/wishlistSchema');
const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")
const Wallet = require("../../models/walletSchema")
const Coupon = require("../../models/couponSchema");
const Varient = require("../../models/varientsSchema");





const getCart = async (req, res) => {
  try {

    const userId = req.session.user;

    if (!userId) {
      return res.redirect("/login")
    }

    const user = await User.findById(userId)

    const cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');

    if(cart){ 

    for (let product of cart.items) {

      const varient = await Varient.findOne({ product_id: product.product_id._id })

      if (varient) {

        varient.inventory.forEach(p => {

          if (p.volume === product.volume) {

            product.sales_price = p.final_price;
            product.regular_price = p.regular_price;
            product.stock = p.stock;

          }
        })

      }
    }
    await cart.save();

  }

    res.render('cart', { cart, user });

  } catch (error) {
    console.log("failed to load cart", error);
    res.redirect("/pageError");
  }
}

const addToCart = async (req, res) => {

  try {


    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity) || 1
    const userId = req.session.user;
    let volume = Number(req.body.volume)


    if (!userId) {
      return res.status(400).json({ success: false, message: "Please log in to Add item to Cart" });
    }

    const product = await Product.findById(productId).populate('category_id');

    if (!volume) {
      volume = product.volume[0]
    }

    const productInventory = await Varient.findOne({ product_id: productId });

    let varient = productInventory.inventory.find(s => s.volume === parseInt(volume));

    product.stock = varient.stock;

    if (!product || product.isBlocked || product.category_id.isDeleted || product.category_id.status === 'blocked' || !product.stock_status || product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product cannot be added" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} left` })
    }


    let cart = await Cart.findOne({ user_id: userId });

    // If cart doesn't exist, create one

    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
      await User.findByIdAndUpdate(userId, { cart_id: cart._id })
    }

    const existingItem = cart.items.find(item => item.product_id.toString() === productId && item.volume === parseInt(volume));

    if (existingItem) {
      product.stock < parseInt(existingItem.quantity + quantity) ? existingItem.quantity = product.stock : existingItem.quantity += quantity
      if (existingItem.quantity > 5) {
        existingItem.quantity = 5;

      }

    } else {
      cart.items.push({ product_id: productId, quantity, volume: volume, regular_price: varient.regular_price, sales_price: varient.final_price });
    }

    //  Remove from wishlist


    await Wishlist.updateOne({ user_id: userId }, { $pull: { products: { product_id: productId , volume : volume } } });

    cart.applied_coupon = null;

    await cart.save();

    return res.status(200).json({ success: true, message: " Item added to cart" });


  } catch (error) {
    console.log("unable to add item to cart ", error);
    return res.status(400).json({ success: false, message: "server error ", error });
  }


}

const removeProduct = async (req, res) => {

  try {
    const productId = req.params.id;
    const userId = req.session.user;
    const volume = req.params.volume;

    await Cart.updateOne({ user_id: userId }, { $pull: { items: { product_id: productId, volume: volume } } });

    res.redirect('/cart');

  } catch (error) {
    console.log("unable to remove item from cart ", error)
    res.redirect("/pageError")
  }

};


const validateCart = async (req, res) => {
  try {

    const userId = req.session.user;
    // const updatedCart = req.body.cartItems;

    if (!userId) return res.status(401).json({ success: false, message: "Please login first" });

    const products = await Product.find();
    const cart = await Cart.findOne({ user_id: userId }).populate({ path: 'items.product_id', select: 'product_name isDeleted isBlocked image' })

    const varients = await Varient.find();

    let total = 0;


    const productVarients = varients.filter(p => {

      return cart.items.some(c => c.product_id._id.toString() === p.product_id.toString())
    })


    for (let product of cart.items) {


      if (!product || product.product_id.isDeleted || product.product_id.isBlocked) {
        return res.status(400).json({ success: false, message: "Some items is not available Please remove to proceed" })
      }


      productVarients.forEach(varient => {
        varient.inventory.forEach(item => {

          if (product.product_id._id.toString() === varient.product_id.toString() && product.volume === item.volume) {

            if (product.quantity > item.quantity) return res.status(400).json({ success: false, message: `Not enough stock available for ${product.product_id.product_name}` })

            if (product.sales_price !== item.final_price) product.sales_price = item.final_price;

            total += item.final_price * product.quantity;

          }

        })
      })

    }

    req.session.total = total.toFixed(2);

    await cart.save()
    req.session.validatedCart = cart;
    res.json({ success: true });

  } catch (error) {
    console.error("Validation of cart error:", error);
    res.status(500).json({ success: false, message: "server error in validation of cart" });

  }
}

// coupoon selection 

const getCoupon = async (userId) => {
  try {

    const user = await User.findById(userId)
    const coupon = await Coupon.find();

    const coupons = coupon.filter(c => c?.user_id?.toString() === userId || c.coupon_type === 'common')

    const notUsedCoupons = coupons.filter(coupon => {
      const appliedCoupon = user.applied_coupons.some(usedId => usedId.toString() === coupon._id.toString())
      const inactiveCoupon = coupon.isActive === false
      const expiredCoupon = coupon.expiry_date && new Date(coupon.expiry_date) < new Date().setHours(0, 0, 0, 0)

      return !appliedCoupon && !inactiveCoupon && !expiredCoupon

    })

    return notUsedCoupons

  } catch (error) {
    console.log("error while loading coupons", error)
  }
}


const checkout = async (req, res) => {
  try {

    const userId = req.session.user;

    const user = await User.findById(userId);

    const validatedItems = req.session.validatedCart;
    const cart = await Cart.findOne({ user_id: userId }).populate('items.product_id')
    const address = await Address.find({ user_id: userId });


    if (!validatedItems || validatedItems.items.length === 0) {
      return res.redirect("/cart");
    }


    function calculateSubtotal(item) {

      return item.items.reduce((sum, item) => sum + item.quantity * item.regular_price, 0);

    }

    function calculateTotal(item) {
      return item.items.reduce((sum, item) => sum + item.quantity * item.sales_price, 0);
    }

    //calculating delivery

    let cartTotal = calculateSubtotal(validatedItems)
    let finalPrice = calculateTotal(validatedItems)

    let discount = cartTotal - finalPrice;

    let delivery_charge = 0;

    if ( finalPrice < 500) {
      finalPrice = finalPrice + 40
      delivery_charge = 40
    }


    const wallet = await Wallet.findOne({ user_id: userId })

    const coupons = await getCoupon(userId)

    const appliedCouponId = cart.applied_coupon.code;

    const appliedCoupon = await Coupon.findById(appliedCouponId)
    let couponDiscount = null;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        couponDiscount = Number((finalPrice * appliedCoupon.offer_price) / 100)
        couponDiscount = couponDiscount > appliedCoupon.max_discount ? appliedCoupon.max_discount : couponDiscount;
        finalPrice = Number(finalPrice - couponDiscount)
      } else {
        finalPrice = Number(finalPrice - appliedCoupon.offer_price)
        couponDiscount = appliedCoupon.offer_price
      }

      req.session.coupon = appliedCoupon._id;
    } else {
      req.session.coupon = false;
    }


    res.render("checkout", {
      user,
      cart: validatedItems,
      subtotal: cartTotal,
      finaltotal: finalPrice,
      address,
      wallet,
      coupons,
      appliedCoupon,
      discount,
      couponDiscount,
      delivery_charge
    });

    req.session.couponApplied = false;
    req.session.delivery = delivery_charge;
    req.session.total = finalPrice.toFixed(2);
    req.session.discount = discount;


  } catch (error) {
    console.log("error in loading checkoutpage", error)
    res.redirect("/cart")
  }
}

const updateCart = async (req, res) => {
  try {

    const quantity = req.body.newQty
    const productId = req.body.productId
    const userId = req.session.user
    const volume = Number(req.body.volume);


    if (!userId) return res.redirect("/");

    const cart = await Cart.findOne({ user_id: userId })

    const varient = await Varient.findOne({ product_id: productId })

    const productVarient = varient.inventory.find(v => v.volume === volume);


    cart.items.forEach(item => {
      if (item.product_id.toString() === productId && item.volume === volume) {
        item.quantity = parseInt(quantity);
        item.sales_price = Number(productVarient.final_price)
        item.regular_price = Number(productVarient.regular_price);

      }
    })

    cart.applied_coupon = null;

    await cart.save()

    res.status(200).json({ success: true })


  } catch (error) {
    console.log("error in updating cart quantity", error)
    res.status(500).json({ success: false })
  }
}


module.exports = { getCart, addToCart, removeProduct, validateCart, checkout, updateCart }