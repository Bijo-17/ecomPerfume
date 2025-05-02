const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
        code: { 
                type: String, 
                required: true 
              },
    coupon_name: { 
                type: String,
                required:true 
             },
    discount_type: { 
                type: String, 
                enum: ['fixed', 'percentage'] 
              },
    discount_value: { 
                 type: String 
              },
               limit: { 
                    type: Number 
                },
     expiry_date: { 
                    type: Date
                 },
       isActive: { 
                   type: Boolean, 
                   default: true },
      created_date: { 
                   type: Date, 
                   default: Date.now 
                    }
});

module.exports = mongoose.model('Coupon', couponSchema);
