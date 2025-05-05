  const mongoose = require('mongoose')
  const appointmentSchema = new mongoose.Schema({
       appointmentId : {
           type : String
       } ,
       patientId : {
               type : String,
               ref : 'patientModel'
        },
        patientName : {
               type : String
        },         
               
        treatment_id : {
                   type : String
        },
        treatment_name : {
                   type : String
        },
        hospital_id : {
               type : mongoose.Schema.Types.ObjectId,
               ref : 'Hospital'
        },
        hospitalName : {
               type : String
        },

        discussionNotes: {
                type: String,
                default: "",
          },

          appointment_Date: {
                type: Date,
                
          },
          createdBy: [{
                    userId: {
                                type: mongoose.Schema.Types.ObjectId,
                                ref: "userModel", 
                               
                    },
                    name: {
                                type: String,

                    },
                    role: {
                            type: String,
                    },
              }],
              status : {
                   type : String,
                   enum : ['Schedule' , 'Follow-Up' ,'Complete' , "Cancelled"],
                   default : 'Schedule'
              },
  } , { timestamps : true })

  const appointmentModel =  mongoose.model('appointment' , appointmentSchema)

  module.exports = appointmentModel