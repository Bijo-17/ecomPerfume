const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
       amount: { 
                 type: Number, 
                 required: true 
                },
  transaction_date: { 
                 type: Date, 
                default: Date.now },
   order_id: { 
                 type: mongoose.Schema.Types.ObjectId, 
                 ref: 'Order' 
             },
      user_id: { 
                  type: mongoose.Schema.Types.ObjectId, 
                  ref: 'User' 
                },
        status: { 
                   type: String, 
                   enum: ['credited', 'debited'], 
                   required: true 
                }
});

module.exports = mongoose.model('Transaction', transactionSchema);
