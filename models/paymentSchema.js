const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
           order_id: { 
                       type: mongoose.Schema.Types.ObjectId, 
                       ref: 'Order' 
                     },
       payment_date: { 
                       type: Date, 
                       default: Date.now 
                     },
       amount_paid: { 
                        type: Number },
      payment_status: { 
                         type: String, 
                         enum: ['pending', 'success', 'failed'] },
       payment_method: { 
                         type: String, 
                          enum: ['upi', 'CARD', 'Bank', 'wallet', 'COD'] 
                        },
        transaction_id: { 
                          type: mongoose.Schema.Types.ObjectId, 
                          ref: 'Transaction' 
                        }
});

module.exports = mongoose.model('Payment', paymentSchema);
