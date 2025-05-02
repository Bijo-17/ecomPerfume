const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
        title: { 
            type: String
        },
        banner_img: [{ type: String }],
      start_date: { 
                    type: Date 
                },
      end_date: { 
                    type: Date 
                },
       status: { 
                  type: Boolean
                 }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);