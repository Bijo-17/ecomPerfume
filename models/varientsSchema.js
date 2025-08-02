const mongoose = require('mongoose')

const varientSchema  = new mongoose.Schema({
         
                       product_id:{
                                   type: mongoose.Schema.Types.ObjectId,
                                   ref: "Product"
                       },

                         inventory: [{
                                   volume: { type: Number},
                                    stock: {type: Number},
                                    regular_price: {type: Number},
                                    sales_price : {type: Number},
                                    final_price : {type: Number}

                       }],
                     

            

  }, {timestamp: true})

module.exports =  mongoose.model("Varients" , varientSchema)