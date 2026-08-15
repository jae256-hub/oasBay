const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    carOwnerName: {
      type: String,
      required: true,
      trim: true,
    },
    carType: {
      type: String,
      required: true,
      trim: true,
    },
    problemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    recommendedSolution: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Pending Quote",
        "Quoted",
        "Assigned",
        "Pending Payment",
        "Paid",
        "Completed",
      ],
      default: "Pending Quote",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedByName: {
      type: String,
      trim: true,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTechnicianName: {
      type: String,
      trim: true,
    },
    quotedAmount: {
      type: String,
      trim: true,
    },
    quoteNotes: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["MasterCard", "Mtn Mobile Money", "Airtel Mobile Money", "QR"],
      default: "QR",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Declined"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

const ServiceRequest =
  mongoose.models.ServiceRequest ||
  mongoose.model("ServiceRequest", serviceRequestSchema);

module.exports = ServiceRequest;
