const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
          
       
         order_id : { 
                           type:String,
                           required: true
                    },
         
           order_item: { 
                         type:mongoose.Schema.Types.ObjectId,
                           ref:'Product'
                      },
               

            total_price: { 
                         type: Number, 
                          required: true 
                      },
            quantity: { 
                          type: Number, 
                          required: true 
                      }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
