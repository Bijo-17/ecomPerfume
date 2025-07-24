
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require('../../models/wishlistSchema');
const User = require("../../models/userSchema")
const Address = require("../../models/addressSchema")
const Wallet = require("../../models/walletSchema")
const Coupon = require("../../models/couponSchema");
const Varient = require("../../models/varientsSchema");



const getCart = async (req,res)=>{
    try {
       
           const userId = req.session.user;

           if(!userId){
            return res.redirect("/login")
           }

           const user = await User.findById(userId)

       const cart = await Cart.findOne({ user_id:userId }).populate('items.product_id');

       let products = [] ;
       let regularPrice=0;
       let salesPrice = 0;
       
       for(let product of cart.items){ 
       

        regularPrice = product.regular_price;
        salesPrice = product.final_price;

        const varient = await Varient.findOne({product_id : product.product_id._id})
        
  
           
         if(varient) { 
            varient.inventory.forEach(p=> {
              console.log("p.vol"  , p.volume , product.volume)
              if(  p.volume === parseInt(product.volume)) {
                  console.log("eneterend")
                   regularPrice = p.regular_price,
                   salesPrice = Number(p.sales_price > p.offer_price) ? p.sales_price : p.offer_price;
                   console.log("reqgualr price" ,product.volume ,  regularPrice , "salesPrice" , salesPrice);
                   products.push({product_name:product.product_id.product_name , volume: product.volume , quantity:product.quantity, regular_price: regularPrice , sales_price : salesPrice  });
                   product.sales_price  = salesPrice;
                   product.regular_price = regularPrice;
              }
            })
             }
       }


       console.log("final " , products ,"\n products")


        res.render('cart', {cart ,user });



    } catch (error) {
        console.log("failed to load cart",error);
        res.redirect("/pageError");
    }
}

const addToCart = async (req,res)=>{

  try {
    

         const productId = req.params.id;
         const quantity = parseInt(req.body.quantity) || 1
         const userId = req.session.user;
          let volume = parseInt(req.body.volume)
         
      
         if(!userId){
            return res.status(400).json({success:false, message: "Please log in to Add item to Cart"});
         }
        

    const product = await Product.findById(productId).populate('category_id');

    if(!volume){
       volume = product.volume[0]
    }
      
    const  productInventory = await Varient.findOne({product_id: productId});
      
   
        if(productInventory){
         
            let varient =  productInventory.inventory.find(s=> s.volume === parseInt(volume));
           
             product.stock = varient.stock;

        }

    
    if (!product || product.isBlocked  || product.category_id.isDeleted || product.category_id.status === 'blocked' || !product.stock_status || product.stock === 0 ) {
      return res.status(400).json({success:false, message:"Product cannot be added"});
    }

    if(product.stock < quantity){
       return res.status(400).json({success:false ,message : `Only ${product.stock} left`})
    }



    let cart = await Cart.findOne({ user_id:userId });

    // If cart doesn't exist, create one

    if (!cart) {
      cart = new Cart({ user_id:userId, items: [] });
       await User.findByIdAndUpdate(userId, {cart_id: cart._id})
    }

    const existingItem =  cart.items.find(item=> item.product_id.toString() ===  productId && item.volume === parseInt(volume) );

   console.log(existingItem , "existing items")

    if (existingItem) {
      product.stock < parseInt(existingItem.quantity+quantity) ? existingItem.quantity = product.stock : existingItem.quantity+= quantity
      if(existingItem.quantity>5){
         existingItem.quantity = 5;
       
      }
    } else { 
      cart.items.push({ product_id:productId, quantity , volume:volume});
    }

    // Step 4: Remove from wishlist
    

    await Wishlist.updateOne({ user_id:userId }, { $pull: { products:{ product_id: productId} } });

    cart.applied_coupon = null;

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

  await Cart.updateOne({ user_id:userId }, { $pull: { items: { product_id:productId } } });


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
          const products = await Product.find();

    

          const cartProducts = products.filter(p=> { 
                return updatedCart.some(c=> c.productId === p._id.toString())
          })
      

         const total = req.body.total;

         req.session.total = total;

         if (!userId) return res.status(401).json({ success: false, message: "Please login first" });
       
          const cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
      
          let invalidProduct = false;
     
          cart.items.forEach(item=>{
            const product = item.product_id;
                   
            if(!product || product.isDeleted || product.isBlocked || !product.stock_status ){
                  invalidProduct = true;    
            }
               for(let x of updatedCart){
                 if(x.productId === item.product_id._id.toString()){
                
                     item.quantity = x.quantity
                 }
               }
                
               for(let p of cartProducts){
                  if(p._id.toString() === product._id.toString() ){
                      if( p.stock < item.quantity ){ 
                      return res.status(400).json({success:false , message: "Not enough stock available for item "+ p.product_name})
                      }
                       
                  }
               }
           
            
          })

         
   
      
           if(invalidProduct){
             return res.status(400).json({success:false, message:"Some items is not unavailable Please remove to proceed"})
           } else  {
               
              await cart.save()
              req.session.validatedCart =  cart;
             
        
              res.json({ success: true });
 
           }  


   } catch (error) {
        console.error("Validation of cart error:", error);
      res.status(500).json({ success: false, message: "server error in validation of cart" });
  
   }
}

// coupoon selection 

const getCoupon = async(userId)=>{
   try {
       
    const user = await User.findById(userId)
    const coupon = await Coupon.find();


      

    const coupons = coupon.filter(c=> c?.user_id?.toString() === userId || c.coupon_type === 'common' )


 
    const notUsedCoupons = coupons.filter(coupon=>{
         const appliedCoupon =  user.applied_coupons.some(usedId=> usedId.toString() === coupon._id.toString() )
             const inactiveCoupon = coupon.isActive === false
             const expiredCoupon = coupon.expiry_date && new Date( coupon.expiry_date) < new Date() 
        
             return !appliedCoupon && !inactiveCoupon && !expiredCoupon

    })
    
  return notUsedCoupons
    
   } catch (error) {
          console.log("error while loading coupons" , error)
   }
}




const checkout = async (req,res)=>{
  try {
     
    const userId = req.session.user;
  
     const user = await User.findById(userId);

  const validatedItems = req.session.validatedCart;
  const cart = await Cart.findOne({user_id:userId}).populate('items.product_id')
  const address = await Address.find({user_id:userId});
 

  if (!validatedItems || validatedItems.length === 0) {
    return res.redirect("/cart");
  }


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

 

 const wallet = await Wallet.findOne({user_id : userId})

 const coupons = await getCoupon(userId)

 const appliedCouponId = cart.applied_coupon.code;


 const appliedCoupon = await Coupon.findById(appliedCouponId)
let discount = 0;
 if(appliedCoupon){
  if(appliedCoupon.discount_type === 'percentage'){
            discount = Number( (finalPrice * appliedCoupon.offer_price)/100)
            discount = discount > appliedCoupon.max_discount ? appliedCoupon.max_discount : discount;
            finalPrice = Number(finalPrice - discount)
  }else{ 
    finalPrice = Number(finalPrice - appliedCoupon.offer_price )
    discount = appliedCoupon.offer_price
  }

    req.session.coupon = appliedCoupon._id;
 }else {
   req.session.coupon = false;
 }

 


  res.render("checkout", {
    user: req.session.user, 
    cart: validatedItems,
    subtotal: cartTotal,
    finaltotal:finalPrice,
    address,
    wallet,
    coupons,
    appliedCoupon,
    discount,
    user
  });

req.session.couponApplied = false;
req.session.delivery = delivery_charge;
req.session.total = finalPrice.toFixed(2) ;
req.session.discount = discount;


  } catch (error) {
     console.log("error in loading checkoutpage",error)
     res.redirect("/cart")
  }
}

const updateCart = async (req,res)=>{
   try {

    const quantity = req.body.newQty
    const productId = req.body.productId
    const userId = req.session.user
    const volume = Number(req.body.volume);
    const {regularPrice , salesPrice } = req.body
    console.log("reqa "  , req.body ,  regularPrice , salesPrice)

      const cart =   await Cart.findOneAndUpdate({user_id: userId})
      console.log("volume" , volume , req.body)
       cart.items.forEach(item=>{
          if(item.product_id.toString() === productId && item.volume === volume){
            console.log("vol" , item.volume , volume)
              item.quantity = parseInt(quantity)
              item.sales_price = Number(salesPrice);
              item.regular_price =  Number(regularPrice);
            
          }
       })

       cart.applied_coupon = null;

       await cart.save()

       res.status(200).json({success:true })

    
   } catch (error) {
      console.log("error in updating cart quantity" , error)
       res.status(500).json({success:false , message: "Server error in updating quantity" + error.message})
   }
}


module.exports = { getCart , addToCart , removeProduct , validateCart ,checkout , updateCart}