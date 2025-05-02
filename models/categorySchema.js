const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
        type: String, 
         required: true 
        },    
  status: 
        { type: String, 
        enum: ['active', 'blocked'], 
        default: 'active' }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category