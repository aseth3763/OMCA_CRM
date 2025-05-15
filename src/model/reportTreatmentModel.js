const mongoose = require("mongoose")

const reportSchema = new mongoose.Schema({
    treatmentId : {
        type : String
    },
    treatment_course_name : {
        type : String
    },
    reportTitle : {
        type : String
    },
    treatmentReport : {
        type : String
    }
},{Timestamp : true})

const reportModel = mongoose.model("treatmentReport",reportSchema)

module.exports = reportModel ;