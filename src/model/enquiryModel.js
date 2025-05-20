const mongoose = require('mongoose')
const enquirySchema = new mongoose.Schema({
       
         enquiryId : {
             type : String
          },
           name  : {
               type : String
          },
          age : {
               type : Number
          },
          country : {
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
          patient_relation_name : {
               type : String
          },
          patient_relation : {
               type : String
          },
          patient_emergency_contact_no : {
               type : Number
          },
          patient_relation_id : {
               type : String
          },
          disease_name : String  ,
          enq_status : {
               type : String,
               enum : ['Pending' , 'Follow-Up' , 'Hold' , 'Confirmed' , 'Dead'],
               default : 'Pending'
          },
          phoneCode : {
               type : String
          },
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

discussionNotes: {
     type : [
          {
          note: { type: String },
          date: { type: Date }
          }
     ],
     default : []
}
         

}, { timestamps : true })

 const enquiryModel = mongoose.model('Enquiry', enquirySchema)

 module.exports = enquiryModel