const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
       user_id: { 
                  type: mongoose.Schema.Types.ObjectId, 
                  ref: 'User', 
                  required: true 
                },
    product_id: { 
                 type: mongoose.Schema.Types.ObjectId, 
                 ref: 'Product', 
                 required: true },
  
       review: { 
                  type: String 
               },

  verified_purchase: { 
                    type: Boolean, 
                    default: false 
                    },
  rating: { 
                type: Number, 
                required: true, 
                min: 1, max: 5 
           }
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);


