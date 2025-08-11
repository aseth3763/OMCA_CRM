const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        serviceId: {
             type: String,
             }, 

        serviceName: {
             type: String,
              }, 

        description: {
             type: String
             }, 

        price: { 
            type: Number,
             }, 

        duration: { 
            type: String,
            enum : ['One-Time' , 'Day' , 'Month']
        },

        isActive: { 
            type: Number,
            enum : [ 0 , 1 ],
            default : 1
            
        }, 
        // Soft delete fields
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }, // assuming "staff" collection exists
    deletedAt: { type: Date }
       
    },
    {
        timestamps: true, 
    }
);

   const serviceModel = mongoose.model('service' , serviceSchema)

   module.exports = serviceModel
