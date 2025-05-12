const mongoose = require("mongoose");
const treatmentSchema = new mongoose.Schema(
  {
    treatment_id: {
      type: String,
    },

    patientId: {
      type: String,
      ref: "patientModel",
    },
    patient_name: {
      type: String,
    },

    treatment_course_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    treatment_course_name: {
      type: String,
    },

    services: [
      {
        serviceId: String,
        serviceName: String,
        price: Number,
        duration: String,
        service_type: {
          type: String,
          enum: ["Paid", "Free"],
        },
      },
    ],

    treatment_course_fee : {
        type : Number
    },

    totalCharge: Number,
    duePayment: {
      type: Number,
      default: 0,
    },

    payment_details: [
      {
        paid_amount: Number,
        paymentMethod: String,
        payment_Date: Date,
      },
    ],

    hospital: [
      {
        hospital_id: {
          type: mongoose.Schema.Types.ObjectId,
        },

        hospital_Name: {
          type: String,
        },
        hospital_charge: {
          type: Number,
        },
      },
    ],

  /*   freeServices: [
      {
        serviceId: String,
        serviceName: String,
        price: Number,
        duration: String,
      },
    ], */

    appointments: [
      {
        appointmentId: String,
        appointment_Date: String,
        disease_name: String,
        status: String,
        pickup_time : String,
          vehicle_no : String,
          driver_name : String,
          driver_contact : String,
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "InProgress", "Complete", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const treatmentModel = mongoose.model("treatment", treatmentSchema);

module.exports = treatmentModel;
