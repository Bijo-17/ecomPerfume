const mongoose = require("mongoose")
const Product = require("./productSchema")

const wishlistSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true  
    },
    products:[{ product_id: { 
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true
    }  
    }],


}, {timestamps:true});

const  Wishlist = new mongoose.model("Wishlist",wishlistSchema)

module.exports = Wishlist;
