
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require('../../models/wishlistSchema');
const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")

const getCart = async (req,res)=>{
    try {
       
           const userId = req.session.user;

           if(!userId){
            return res.redirect("/login")
           }

       const cart = await Cart.findOne({ user_id:userId }).populate('items.product_id');

    if(cart){ 

         cart.items.forEach(element => {
               if (element.product_id.isBlocked){
                   console.log("bloced item found",element.product_id.product_name);
               } else if(element.product_id.isDeleted){
                    
               } else if(element.product_id.stock === 0){
                    
               }

         });

        }

        res.render('cart', {cart });



    } catch (error) {
        console.log("failed to load cart",error);
        res.redirect("/pageNotFound");
    }
}

const addToCart = async (req,res)=>{

  try {
    
    console.log("adddded to caaaaaaaart posteddddddddddddd")
         const productId = req.params.id;
         const userId = req.session.user;

         console.log("productId",productId ,"from  post")
      
         if(!userId){
            return res.status(400).json({success:false, message: "Please log in to Add item to Cart"});
         }
        

    const product = await Product.findById(productId).populate('category_id');

    
    if (!product || product.isBlocked  || product.category_id.isDeleted || product.category_id.status === 'blocked' || !product.stock_status  ) {
      return res.status(400).json({sucess:false, message:"Product cannot be added"});
    }

    let cart = await Cart.findOne({ user_id:userId });

    // Step 2: If cart doesn't exist, create one
    if (!cart) {
      cart = new Cart({ user_id:userId, items: [] });
       await User.findByIdAndUpdate(userId, {cart_id: cart._id})
    }

    const existingItem = cart.items.find(item => item.product_id.equals(productId));

    if (existingItem) {
      existingItem.quantity += 1;
    } else { 
      cart.items.push({ product_id:productId, quantity: 1 });
    }

    // Step 4: Remove from wishlist



    await Wishlist.updateOne({ user_id:userId }, { $pull: { products:{ product_id: productId} } });

    await cart.save();

     return res.status(200).json({success:true , message:" Item added to cart"});


  } catch (error) {
     console.log("unable to add item to cart ",error);
    return res.status(400).json({success:false, message: "server error ",error});
    }


}

const removeProduct =  async (req, res) => {

  try{ 
  const  productId  = req.params.id;
  const userId = req.session.user;
  console.log("product Id",productId)
  const removeItem = await Cart.updateOne({ user_id:userId }, { $pull: { items: { product_id:productId } } });

  console.log("remove itme ",removeItem)
  res.redirect('/cart');

  } catch (error){
      console.log("unable to remove item from cart ", error)
      res.redirect("/pageNotFound")
  }
  
};

const validateCart = async (req,res) => {
   try {
    
         const userId = req.session.user;
         const updatedCart = req.body.cartItems;

         const total = req.body.total;

         req.session.total = total;

         if (!userId) return res.status(401).json({ success: false, message: "Please login first" });
       
          const cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
   console.log("fresh cart" , cart , " untouchedd\n\n")
          let invalidProduct = false;
         console.log("cart before",cart ,"beforreeee")
          cart.items.forEach(item=>{
            const product = item.product_id;
                     console.log("what si prodcut",product._id)
            if(!product || product.isDeleted || product.isBlocked || !product.stock_status ){
                  invalidProduct = true;    
            }
              for(let id of updatedCart){ 
                  if(product._id == id.productId){
                    console.log("itemsfound")
                    console.log("cart quantity ",item.quantity ," session quantity ",id.quantity);

                     item.quantity = id.quantity
                  }
                }
            
          })
  console.log("cart after updation",cart)
         
          for(let x of updatedCart){
            console.log("x is ",x.productId)

          }

          console.log("pro",updatedCart[0].productId)
      
           if(invalidProduct){
             return res.status(400).json({success:false, message:"Some items is not unavailable Please remove to proceed"})
           } else {
               
            console.log("updaged cart ", updatedCart)
              
              req.session.validatedCart =  cart;

              console.log("iinsdide caertt ", cart , "\n end of cart items \n")
              res.json({ success: true });

           }  


   } catch (error) {
        console.error("Validation of cart error:", error);
      res.status(500).json({ success: false, message: "server error in validation of cart" });
  
   }
}

const checkout = async (req,res)=>{
  try {
     
    const userId = req.session.user;
  
    
  const validatedItems = req.session.validatedCart;
  const cart = await Cart.findOne({user_id:userId}).populate('items.product_id')
  const address = await Address.find({user_id:userId});
 

  if (!validatedItems || validatedItems.length === 0) {
    return res.redirect("/cart");
  }
  // console.log("validated data",validatedItems.items[0].product_id)

  function calculateTotal(item) {
  
  return item.items.reduce((sum, item) => sum + item.quantity * item.product_id.final_price, 0);
}

//calculating delivery

let cartTotal = calculateTotal(validatedItems)

 let finalPrice = cartTotal > 500 ? cartTotal : cartTotal+40
 let delivery_charge= 0;
 if(finalPrice !== cartTotal){
    delivery_charge = (finalPrice-cartTotal);
 }

 console.log("finla pricre",finalPrice , "-" , delivery_charge)

  res.render("checkout", {
    user: req.session.user,
    cart: validatedItems,
    subtotal: cartTotal,
    finaltotal:finalPrice,
    address
  });



req.session.delivery = delivery_charge;
req.session.total = finalPrice.toFixed(2) ;
 console.log("calculate sum ", calculateTotal(validatedItems))

  } catch (error) {
     console.log("error in loading checkoutpage",error)
     res.redirect("/cart")
  }
}


module.exports = { getCart , addToCart , removeProduct , validateCart ,checkout}