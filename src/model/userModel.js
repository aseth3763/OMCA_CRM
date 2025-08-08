const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone_no: { type: Number },
  profileImage: { type: String },
  gender: {
    type: String,
    enum: ['Female', 'Male', 'Other']
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Receptionist', 'Finance', 'Coordinator']
  },
  password: { type: String },
  status: {
    type: Number,
    enum: [1, 0],
    default: 1
  },
  refreshToken: String,

  // 🔹 New Field for Role-Based Patient Status Control
  roleStatuses: {
    type: [String], // Array of statuses allowed for this role
    default: []     // Example: ["Pending", "Confirmed", "On Hold"]
  },

  userLogs: [
    {
      date: {
        type: Date,
        required: true,
        default: new Date(),
      },
      loginTime: { type: String },
      logoutTime: { type: String, default: '' },
      activeDuration: { type: Number, default: 0 },
    },
  ],
}, { timestamps: true });

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
