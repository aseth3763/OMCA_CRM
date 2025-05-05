const mongoose = require('mongoose')
const hospitalSchema = new mongoose.Schema({
       hospitalName : {
            type : String
       },
        location : {
              type : String
        },
        hospitalCode : {
               
        },
        contact : {
               type : Number
        },
        PatientAssigned : [{
                patientId : {
                       type : String
                },
                Assigned_Date : {
                       type : Date
                }
        }],
        hospitalImage : {
               type : String
        },
        status : {
               type : Number,
               enum : [1 ,0],
               default : 1
        }

}, {timestamps : true })

const hospitalModel = mongoose.model('Hospital', hospitalSchema)
module.exports = hospitalModel