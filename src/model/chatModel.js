const mongoose = require('mongoose')
const chatSchema = new mongoose.Schema({ 

              userId : mongoose.Schema.Types.ObjectId,
              userName : String,
              message : String,
              attachment : String,
              status : {
                    type : Number,
                    enum : [1 , 0],
                    default : 1
              }
}, {timestamps : true })

const chatModel = mongoose.model('user_chatRoom' , chatSchema)

module.exports = chatModel