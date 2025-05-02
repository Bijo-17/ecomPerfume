const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
         product_name: { 
                        type: String, 
                        required: true 
                      },
                price: { 
                         type: Number, 
                          required: true 
                      },
            quantity: { 
                          type: Number, 
                          required: true 
                      }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
