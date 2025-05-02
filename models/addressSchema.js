
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    user_id: { 
             type: mongoose.Schema.Types.ObjectId, 
             ref: 'User', 
             required: true 
    },
    first_name: {   
            type: String, 
            required: true 
     },
            last_name: { 
            type: String,
            required: true 
     },
     date_of_birth: { 
            type: Date,
            required: true 
    },
     gender: { 
             type: String, 
             enum: ['male', 'female'],
             required: true 
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
            required: true 
    },
    phone_number:{
        type: Number,
        required: true

    }
 }, 
     { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address