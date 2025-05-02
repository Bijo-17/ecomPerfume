const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
     user_id: { 
               type: mongoose.Schema.Types.ObjectId, 
               ref: 'User', 
               required: true 
              },
   transaction_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
     balance: { 
                type: Number, 
                 default: 0 },
  status: { 
                type: String, 
                enum: ['credited', 'debited'] }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);


