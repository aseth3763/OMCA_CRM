const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    otp : {
        type : Number
    }
},{timestamps:true})

const otpModel = mongoose.model("otp",otpSchema)

module.exports=otpModel