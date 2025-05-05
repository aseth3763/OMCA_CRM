const mongoose = require('mongoose');

const freeServiceSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
        },

        serviceName: {
            type: String,
        },

        description: {
            type: String,
        },

        duration: {
            type: String,
            enum: ['One-Time', 'Day', 'Month'],
        },
        isActive: {
            type: Number,
            enum: [0, 1],
            default: 1,
        },
    },
    {
        timestamps: true,
    }
);

const freeServiceModel = mongoose.model('free_service', freeServiceSchema);

module.exports = freeServiceModel;
