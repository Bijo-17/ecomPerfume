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
                        required: true },
           description: 
                         { type: String,
                            required:true
                          },
             stock:     { 
                         type: Number, 
                          required:true},
           stock_status: { 
                          type: Boolean ,
                           required:true
                          },
            regular_price: { 
                          type: Number,
                          required:true
                          },
            offer_price: { 
                           type: Number 
                          },
                 image: [{ type: String }],
                volume: [{ type: String }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product