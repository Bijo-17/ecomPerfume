const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
        code: { 
                type: String, 
               
              },
      coupon_type: {
                      type:String,
                      enum: ['common' , 'referal'],
                      default: 'common'
                 },
         user_id : { 
                        type: mongoose.Schema.Types.ObjectId,
                        ref:'User',
                        sparse:true
                   } ,   

    coupon_name: { 
                type: String,
                required:true 
             },
    discount_type: { 
                type: String, 
                enum: ['fixed', 'percentage'] ,
                default:'fixed'
              },
      offer_price: { 
                 type: Number
              },
       max_discount: {
                        type:Number
       }   , 
        minimum_price: { 
                    type: Number 
                },
     expiry_date: { 
                    type: Date
                 },
       isActive: { 
                   type: Boolean, 
                   default: true },
       start_date: { 
                   type: Date, 
                   default: Date.now 
                    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
