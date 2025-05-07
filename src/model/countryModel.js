const mongoose = require("mongoose")

const countrySchema = new mongoose.Schema({
    countryName : {
        type : String
    },
    countryCode : {
        type : String
    },
    countryCapital : {
        type : String
    },
    countryCurrency : {
        type : String
    },
    phoneCode : {
        type : String
    }
},{timestamps : true})

const countryModel = mongoose.model("country",countrySchema)

module.exports = countryModel