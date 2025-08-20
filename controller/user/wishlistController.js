const Wishlist = require("../../models/wishlistSchema")
const Product = require("../../models/productSchema")
const User = require("../../models/userSchema")
const Varient = require("../../models/varientsSchema")


const getWishlist = async (req, res) => {

  try {

    const userId = req.session.user;
    const wishlist = await Wishlist.findOne({ user_id: userId }).populate({path:'products.product_id' , populate:{path: 'varients_id category_id brand_id' } })
    const user = await User.findById(userId)

  if(wishlist){ 
     for(let product of wishlist.products){  
        const varient = await Varient.findOne({product_id : product.product_id._id})
          
           const status = varient.inventory.some(v=> v.volume === product.volume && v.stock < 1);

           if(status) product.status = false;
           if(product.product_id.isBlocked || product.product_id.isDeleted || 
                       product.product_id.category_id.status === 'blocked' || product.product_id.category_id.isDeleted || 
                       product.product_id.brand_id.status === 'block' || product.product_id.brand_id.isDeleted
             ) {

                   product.status = false;
              }  
       
      }
    }

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
    let volume = Number(req.body.volume);


    if (!userId) {
      return res.status(400).json({ success: false, message: "Please log in to Add item to wishlist" });
    }

    const product = await Product.findById(productId).populate('category_id brand_id');

    if(!volume) volume = product.volume[0];

    if (!product || product.isBlocked || product.category_id.isDeleted || product.category_id.status === 'blocked' 
             || !product.stock_status || product.brand_id.status === 'block' || product.brand_id.isDeleted) {

               return res.status(400).json({ sucess: false, message: "Product cannot be added" });
    }

    let wishlist = await Wishlist.findOne({ user_id: userId });

    // Step 2: If wishlist doesn't exist, create one
    if (!wishlist) {
      wishlist = new Wishlist({ user_id: userId, products: [] });
      await User.findByIdAndUpdate(userId, { wishlist_id: wishlist._id })
    }

    const existingItem = wishlist.products.find(item => item.product_id.equals(productId) && item.volume === volume);

    if (!existingItem) {

      wishlist.products.push({ product_id: productId , volume : volume });

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