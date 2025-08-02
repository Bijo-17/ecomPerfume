const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
           user_id: { 
                     type: mongoose.Schema.Types.ObjectId, 
                     ref: 'User',
                     required:true 
                    },
          coupon_id: { 
                     type: mongoose.Schema.Types.ObjectId, 
                     ref: 'Coupon',
                     default:null
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
                              _id: mongoose.Schema.Types.ObjectId,
                              name: String,
                              phone_number: Number,
                              address_name: String,
                              locality: String,
                              city: String,
                              state: String,
                              pin_code: Number,
                              address_type: String
                         

                      },
          order_date: { 
                      type: Date, 
                      default: Date.now,
                      required:true  
                    },
          order_status: { 
                     type: String, 
                     enum: ['pending','processing', 'shipped', 'delivered', 'cancelled', 'returned' ,'failed' , 'out_for_delivery'], default: 'pending' 
                    },
            total_price: { 
                     type: Number,
                     required:true  
                    },
               discount: { 
                              type: Number,
                              default:0,
                      }, 

          order_items: [{
                         product_id: { 
                        type: mongoose.Schema.Types.ObjectId, 
                        ref: 'Product' },
                        quantity: { type: Number },
                        volume: {type:Number},
                        product_price:{ type: Number },
                        delivery_charge: {type : Number},
                        order_status: { 
                                        type: String, 
                                         enum: ['pending','processing', 'shipped', 'delivered', 'out_for_delivery', 'cancelled', 'returned' , 'failed'], default: 'failed' 
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
                                            },
                              payment: {
                                          method: {
                                                     type: String ,
                                                     enum:['cod','online']
                                          },

                                          status:{type:String , enum: [   "paid" , "unpaid"]},
                                                order_id: {type:String},
                                                payment_id : {type:String},
                                     },                            
                      
                        }],

            delivered_date: {
                               type: Date,
                            },  
              
           estimated_delivery: {
                                  type : Date,
                            },                      
           
              isPaid: { 
                        type: Boolean,
                        default:false
                     
                     } ,          

        payment_method: 
                  {
                     method: { type: String },
                     status: { type: String },
                     razorpay_payment_id : { type: String},
                    razorpay_order_id: {type:String},
                   }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
