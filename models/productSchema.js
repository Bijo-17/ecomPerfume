const { parse } = require('dotenv');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
         product_name: { 
                         type: String, 
                         required: true 
                        },
         category_id: 
                       { 
                        type: mongoose.Schema.Types.ObjectId, 
                        ref: 'Category', 
                        required: true },
           subcategory_id: 
                        { type: mongoose.Schema.Types.ObjectId, 
                        ref: 'SubCategory', 
                        sparse: true },
            brand_id: 
                     {
                         type:mongoose.Schema.Types.ObjectId,
                         ref: 'Brand'
                     },            

            isBlocked: {
                          type : Boolean,
                           default:false
                        }, 
            isDeleted: {
                          type : Boolean,
                           default:false
                        },                        
           description: 
                         { type: String,
                            required:true
                          },
             stock:     { 
                         type: Number, 
                          required:true},
           stock_status: { 
                          type: Boolean ,
                           required:true,
                           
                          },
            regular_price: { 
                          type: Number,
                          required:true
                          },
            sales_price: { 
                           type: Number 
                          },
             offer_price:{
                          type: Number,
                          default:0
                         }, 
         averageRating: { type: Number, 
                          default: 0 
                        },
           ratingCount: {
                          type:Number,
                          default:0
                        } ,            
                 image: [{ type: String }],
                volume: [{ type: String }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product