const Wishlist = require("../../models/wishlistSchema")
const Product = require("../../models/productSchema")
const User = require("../../models/userSchema")


const getWishlist = async (req, res) => {

  try {

    const userId = req.session.user;
    const wishlist = await Wishlist.findOne({ user_id: userId }).populate('products.product_id')
    const user = await User.findById(userId)

    res.render("wishlist", { layout: "../layout/userAccount", active: "wishlist", wishlist, user })

  } catch (error) {

    console.log("error in loading wishlist", error);
    res.redirect("/pageError")

  }

}


const addToWishlist = async (req, res) => {

  try {

    const productId = req.params.id;
    const userId = req.session.user;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Please log in to Add item to wishlist" });
    }

    const product = await Product.findById(productId).populate('category_id');

    if (!product || product.isBlocked || product.category_id.isDeleted || product.category_id.status === 'blocked' || !product.stock_status) {
      return res.status(400).json({ sucess: false, message: "Product cannot be added" });
    }

    let wishlist = await Wishlist.findOne({ user_id: userId });

    // Step 2: If wishlist doesn't exist, create one
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: userId, products: [] });
      await User.findByIdAndUpdate(userId, { wishlist_id: wishlist._id })
    }

    const existingItem = wishlist.products.find(item => item.product_id.equals(productId));

    if (!existingItem) {

      wishlist.products.push({ product_id: productId });

    }

    await wishlist.save();

    return res.status(200).json({ success: true, message: " Item added to wishlist" });

  } catch (error) {
    console.log("unable to add item to wishlist ", error);
    return res.status(400).json({ success: false, message: "server error in add item to wishlist ", error });
  }

}


const removeProduct = async (req, res) => {

  try {
    const { productId } = req.params
    const userId = req.session.user;

    await Wishlist.updateOne({ user_id: userId }, { $pull: { products: { product_id: productId } } });

    res.redirect('/wishlist');

  } catch (error) {
    console.log("unable to remove item from wishlist ", error)
    res.redirect("/pageError")
  }

};



module.exports = { getWishlist, addToWishlist, removeProduct }