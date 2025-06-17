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
                   
                    },
            order_id: { 
                        type:String,
                        required:true
                    },      
          temp_address:{
                          type: Object,
          },        
          order_date: { 
                      type: Date, 
                      default: Date.now,
                      required:true  
                    },
          order_status: { 
                     type: String, 
                     enum: ['pending','processing', 'shipped', 'delivered', 'canceled', 'returned'], default: 'pending' 
                    },
            total_price: { 
                     type: Number,
                     required:true  
                    },
             

          order_items: [{
                         product_id: { 
                        type: mongoose.Schema.Types.ObjectId, 
                        ref: 'Product' },
                        quantity: { type: Number },
                        product_price:{ type: Number },
                        delivery_charge: {type : Number},
                        order_status: { 
                                        type: String, 
                                         enum: ['pending','processing', 'shipped', 'delivered', 'out_for_delivery', 'cancelled', 'returned'], default: 'pending' 
                                     },

                        cancelled_date: {
                                            type : Date,
                                        }, 

                        return_request: {
                                             status: {
                                                         type: String,
                                                          enum: ['none', 'requested', 'approved', 'rejected'],
                                                          default: 'none',
                                                      },
                                             reason: {
                                                           type: String,
                                                           default: '',
                                                        },
                                           requestedAt: {
                                                            type: Date,
                                                        },
                                                            verifiedAt: {
                                                             type: Date,
                                                        },
                                          refundAmount: {
                                                            type: Number,
                                                         },
                                            }           
                      
                        }],

            delivered_date: {
                               type: Date,
                            },  
              
           estimated_delivery: {
                                  type : Date,
                            },       
           
                          

        payment_method: 
                  {
                     method: { type: String },
                     status: { type: String }
                   }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
