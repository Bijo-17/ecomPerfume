const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
       user_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
       },
       product_id:{
                   type:mongoose.Schema.Types.ObjectId,
                   ref:"Product",
                   required:true
       },
       quantity:{
                 type:Number,
                 default:1,
                 required:true
       }
}, {timestamps:true})

const Cart = new mongoose.model("Cart",cartSchema)

module.exports = Cart