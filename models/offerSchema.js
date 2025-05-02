const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
          product_id: { 
                       type: mongoose.Schema.Types.ObjectId, 
                       ref: 'Product' },
   discount_per_product: 
                        { 
                        type: Number 
                       }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
