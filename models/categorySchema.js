const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
        type: String, 
         required: true 
        },    
  status: 
        { type: String, 
        enum: ['active', 'blocked'], 
        default: 'active' },

        isDeleted: {
            type: Boolean,
            default: false
          },
    category_offer: {
                    type: Number,
                    default:0
    }  ,
     category_image: {
                          type: String
     }    
              
},

{ timestamps: true });


    

const Category = mongoose.model('Category', categorySchema);

module.exports = Category