const mongoose = require("mongoose");
const env = require("dotenv").config();

const connectDB = async ()=>{
 try {

    await mongoose.connect(process.env.MONGODB_URI)
     console.log("mongodb connected")
    
} catch (error) {
    console.log("failed to connect mongodb",error.message)
    process.exit(1)
}
}

module.exports = connectDB
