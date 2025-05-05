const mongoose = require('mongoose');

const permissionDashboardSchema = new mongoose.Schema({
    role: {
         type: String,
         required: true,
         enum: ['Admin', 'Receptionist' , 'Manager'] 
        },
     permissions: {
        type: Map,  // Dynamic key-value pair
        of: Number, // 1 for allowed, 0 for denied
        required: true,
    },
});

const PermissionDashboardModel = mongoose.model('PermissionDashboard', permissionDashboardSchema);
module.exports = PermissionDashboardModel;
