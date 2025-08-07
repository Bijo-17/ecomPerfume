
const mongoose = require('mongoose')

const contactMessageSchema = new mongoose.Schema({
      name: {
              type: String
            },
       email:{
              type: String
            },
         subject: {
               type: String
         },
          message:{
              type: String
          },
         status: {
                   type: String,
                  enum:['unread', 'read'],
                  default: 'unread'
               }    
 
}, { timestamps: true  })

module.exports = mongoose.model('contactMessage' , contactMessageSchema)