
const mongoose = require("mongoose")
const {Schema} = mongoose;

const userSchema = new Schema({
    name:{
        type:String,
        required:true
        
    },
    email:{
        type:String,
        requied:true,
        unique:true    
    },
    phone: {
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    
 

    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    password : {
        type:String,
        required :false
    },


    isBlocked: {
        type : Boolean,
        default:false
    },
    isAdmin : {
        type: Boolean,
        default:false
    },

    address: {
        
        type:Schema.Types.ObjectId,
          ref:"Address",
       
 },
    cart_id: {
            type:Schema.Types.ObjectId,
            ref:"Cart",
    },
    wallet_id:{
        type:Schema.Types.ObjectId,
        ref:"Wallet"
    },
    wishlist_id:{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    },
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn : {
        type:Date,
        default:Date.now,
    },
    referralCode:{
        type:String
    },
    redeemed:{
        type:Boolean,
        default: 0
    },
    referralEarnings:{
                          type:Number,
                          default:0
                   },
   
    referredUsers: [{user_id:{ type: mongoose.Schema.Types.ObjectId, ref: "User" , default:null },
                     coupon_id:{type:mongoose.Schema.Types.ObjectId, ref: "Coupon" , default:null},
                     }],
    date_of_birth:{
                   type: Date,
    },
    gender:{
           type: String,
           enum: ['male','female']
    },

    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref:"Category",
        },
        brand: {
            type : String
        },
        searchOn : {
            type: Date,
            default: Date.now
        }
    }],
      profileImage:{
        type:String
    }, 

      applied_coupons:[{
         type:Schema.Types.ObjectId,
         ref:"Coupon"
         
    }],
    isDeleted:{
            type:Boolean,
            default:false
    },
  
 }, { timestamps: true });

 const User = mongoose.model("User",userSchema)

 module.exports=User




