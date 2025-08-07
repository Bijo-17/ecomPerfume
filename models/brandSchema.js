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
                },
        isDeleted: {
                type:Boolean,
                default:false
        },        
        image: { type: String },        
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
