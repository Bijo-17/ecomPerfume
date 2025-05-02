const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
         name: { 
                 type: String, 
                 required: true 
                },
         offer: { 
                  type: String 
                },
        status: { 
                   type: String, 
                   enum: ['active', 'blocked'], default: 'active' 
                }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
