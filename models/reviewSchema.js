const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
       user_id: { 
                  type: mongoose.Schema.Types.ObjectId, 
                  ref: 'User', 
                  required: true 
                },
    product_id: { 
                 type: mongoose.Schema.Types.ObjectId, 
                 ref: 'Product', 
                 required: true },
         name: { 
                  type: String 
                },
        title: { 
                   type: String 
                },
    description: { 
                    type: String 
                },
  verified_purchase: { 
                    type: Boolean, 
                    default: false 
                    },
  rating: { 
               type: Number, 
                enum: [1, 2, 3, 4, 5] 
           }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
