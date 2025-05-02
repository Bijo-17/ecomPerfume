const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
           user_id: { 
                     type: mongoose.Schema.Types.ObjectId, 
                     ref: 'User',
                     required:true 
                    },
          coupon_id: { 
                     type: mongoose.Schema.Types.ObjectId, 
                     ref: 'Coupon' 
                    },
          address_id: { 
                     type: mongoose.Schema.Types.ObjectId, 
                     ref: 'Address',
                     required:true 
                    },
          order_date: { 
                      type: Date, 
                      default: Date.now,
                      required:true  
                    },
          order_status: { 
                     type: String, 
                     enum: ['pending', 'shipped', 'completed'], default: 'pending' 
                    },
            total: { 
                     type: Number,
                     required:true  
                    },
          order_items: [{
                         product_id: { 
                        type: mongoose.Schema.Types.ObjectId, 
                        ref: 'Product' },
                        quantity: { type: Number }
                        }],
        payment_method: 
                  {
                     method: { type: String },
                     status: { type: String }
                   }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
