const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {  
          type: String, 
          required: true 
  },
  status: { 
          type: String, 
           enum: ['active', 'blocked'], 
           default: 'active' 
        },
           category_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category', 
            required: true 
        }
     }, { timestamps: true });

SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;
