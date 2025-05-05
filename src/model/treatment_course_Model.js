const mongoose = require('mongoose')
const treatment_course_Schema = new mongoose.Schema({
       
          course_name : {
                type : String
          },
            
             categories : [{
                    category_name : {
                           type : String
                    }
             }] ,

           status : {
               type : Number,
               enum : [ 1 , 0 ]
           },
           course_price : {
                  type : Number
           }

} , { timestamps : true })

const treatement_course_model = mongoose.model('treatement_course' , treatment_course_Schema)

module.exports = treatement_course_model


