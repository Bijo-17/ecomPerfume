
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    user_id: { 
             type: mongoose.Schema.Types.ObjectId, 
             ref: 'User', 
             required: true 
    },
     isDefault:{
            type: Boolean,
            default:false
     },
    name : {
           type: String,
           required:true
    },
       address_name: {   
            type: String, 
            required: true 
     },
    
     date_of_birth: { 
            type: Date,
          
    },
     gender: { 
             type: String, 
             enum: ['male', 'female'],
            
    },

    locality:{
         type:String,
         required:true
        },  
     city: { 
            type: String,
            required: true 
    },
    landmark:{
        type: String
    },
      state: { 
            type: String,
            required: true 
    },
       pin_code: { 
            type: Number,
            required: true 
    },
        country: { 
            type: String,
           
    },
    phone_number:{
        type: Number,
        required: true

    },
    alt_phone_number:{
           type: Number,
           sparse:true
    },
    address_type: { 
    type:String,
       enum:['home','work']
       
     }, 
 },   
     { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address