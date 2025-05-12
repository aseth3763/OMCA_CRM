const mongoose = require("mongoose")

const countrySchema = new mongoose.Schema({
    name : {
        type : String
    },
    code : {
        type : String
    },
    dial_code : {
        type : String
    },
    status :  {
        type : String,
        enum : ["0","1"],
        default : "1"
    }
},{timestamps : true})

const countryModel = mongoose.model("country",countrySchema)

module.exports = countryModel