const mongoose = require('mongoose')
const patientSchema = new mongoose.Schema({
       
           patientId : {
             type : String
          },
          enquiryId : {
               type : String
          },
           patient_name  : {
               type : String
          },
          age : {
               type : Number
          },
          country : {
               type : String
          },
          phoneCode : {
               type : String
          },
          email : {
               type : String
          },
          gender : {
               type : String,
               enum : ['Male' , 'Female' , 'Others']
          },
          emergency_contact_no : {
               type : Number
          },
          address : {
               type : String
          },
          patient_emergency_contact_no : {
               type : Number
          },
          patient_relation_name : {
               type : String
          },
          patient_relation : {
               type : String
          },
          patient_relation_id : {
               type : String
          },
          patient_type : {
                type : String,
                enum : ['New' , 'Repeat' , 'Completed' , 'Dead' ],
                default : 'New'

          },
          patient_disease :[ {
               disease_name : {
                         type : String,
                         // enum : ['Diabities' , 'Cancer' , 'Eyes' , 'Others']
                    }
          }],
          patient_status : {
                type : String,
                enum : [ 'Pending', 'Confirmed' ,  'Denied',  'Follow-Up' ,'Completed'],
                default : 'Confirmed'
          },
          ismedicalHistory : {
               type : Number,
               enum : [ 0 , 1 ]
          },
          treatment_course_name : {
               type : String,
               default : ""
    },
          medical_History : [{
                            disease : {
                                    type : String,
                                    
                            },
                            reports : {
                                    type : [String]
                            }
          }],
          created_by : [{
                            Name : {
                                    type : String
                            },
                            role : {
                                type : String
                            },
                            userId : {
                                type : mongoose.Schema.Types.ObjectId
                            }
          }],
         
         

          status : {
               type : Number,
               enum : [1 , 0],
               default : 1
          },
             discussionNotes: [{
                 
                 note : {               
                 type: String,
                
                 },
                  date : {
                        type : Date
                  }
                 
                 }],

               treatmentCount : {
                    type : Number,
                    default : 0
               } ,
               serviceCount : {
                    type : Number ,
                    default : 0
               },   
                
               Kyc_details : [{
                          id_proof : {
                                 type : String
                          },
                          passport : {
                                 type : String
                          },
                          photo : {
                                type : String
                          },

               }],
                  services  : [{
                              serviceId : String,
                              serviceName : String,
                              price : Number,
                              service_type: {
                                   type: String,
                                   enum: ["Paid", "Free"],
                                 },
                              
                }]



}, { timestamps : true })

 const patientModel = mongoose.model('patient', patientSchema)

 module.exports = patientModel