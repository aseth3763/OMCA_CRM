const mongoose = require("mongoose")

const reportSchema = new mongoose.Schema({
    treatmentId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "treatment"
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