const mongoose = require("mongoose");
const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
    },
    patientNumber: {
      type: String,
    },
    enquiryId: {
      type: String,
    },
    patient_name: {
      type: String,
    },
    age: {
      type: Number,
    },
    country: {
      type: String,
    },
    town : {
      type : String
    },
    phoneCode: {
      type: String,
    },
    email: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    emergency_contact_no: {
      type: Number,
    },
    address: {
      type: String,
    },
    patient_emergency_contact_no: {
      type: Number,
    },
    patient_relation_name: {
      type: String,
    },
    patient_relation: {
      type: String,
    },
    patient_relation_id: {
      type: String,
    },
    patient_type: {
      type: String,
      enum: ["New", "Repeat", "Completed", "Dead"],
      default: "New",
    },
    patient_disease: [
      {
        disease_name: {
          type: String,
          // enum : ['Diabities' , 'Cancer' , 'Eyes' , 'Others']
        },
      },
    ],
    patient_status: {
      type: String,
      enum: ["Pending", "Confirmed", "Denied", "Follow-Up", "Completed"],
      default: "Confirmed",
    },
    ismedicalHistory: {
      type: Number,
      enum: [0, 1],
    },
    treatment_course_name: {
      type: String,
      default: "",
    },
    medical_History: [
      {
        disease: {
          type: String,
        },
        reports: {
          type: [String],
        },
      },
    ],
    created_by: [
      {
        Name: {
          type: String,
        },
        role: {
          type: String,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
    p_status : {
               type  : String,
               enum : ["Foundation", "Private", "Travelled", "Confirmed", "Pending" , "On Hold", "Cancelled", "Local Case", "Follow Up",
                    "Passed Away"],
               default : "Foundation"
          },

    status: {
      type: Number,
      enum: [1, 0],
      default: 1,
    },
    discussionNotes: [
      {
        note: {
          type: String,
        },
        date: {
          type: Date,
        },
      },
    ],

    treatmentCount: {
      type: Number,
      default: 0,
    },
    serviceCount: {
      type: Number,
      default: 0,
    },

    Kyc_details: [
      {
        id_proof: {
          type: String,
        },
        passport: {
          type: String,
        },
        photo: {
          type: String,
        },
        Attende_id_proof: {
          type: String,
        },
        Attende_passport: {
          type: String,
        },
        Attende_photo: {
          type: String,
        },
      },
    ],
    services: [
      {
        serviceId: String,
        serviceName: String,
        price: Number,
        service_type: {
          type: String,
          enum: ["Paid", "Free"],
        },
        startTime: Date,
        endTime: Date,
      },
    ],
    isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "staff",
  },
  deletedAt: {
    type: Date,
  },
    createdAt: {
  type: Date,
  default: Date.now
},
updatedAt: {
  type: Date,
  default: Date.now
},
isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }, // assuming "staff" collection exists
    deletedAt: { type: Date }

  });

const patientModel = mongoose.model("patient", patientSchema);

module.exports = patientModel;
