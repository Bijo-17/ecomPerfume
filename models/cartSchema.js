const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
       user_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
       },
       
       items:[{  product_id: {    
                   type:mongoose.Schema.Types.ObjectId,
                   ref:"Product",
                   required:true,
                },
             quantity: { 
                      type:Number,
                     default:1,
                      required:true

                 },
               volume:{ type: Number},
                regular_price : {type: Number},
                sales_price : {type: Number},
                stock: {type:  Number}
           } ],

         applied_coupon: {
                            code:String,
                            discountAmount : Number
                           
          }
      
}, {timestamps:true})

const Cart = new mongoose.model("Cart",cartSchema)

module.exports = Cart