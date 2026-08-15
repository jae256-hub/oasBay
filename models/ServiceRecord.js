const mongoose = require("mongoose");

const serviceRecordSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: false,
    },
    carOwnerName: { type: String, required: true, trim: true },
    carType: { type: String, required: true, trim: true },
    problemDescription: { type: String, required: true, trim: true },
    recommendedSolution: { type: String, trim: true, default: "" },
    partsUsed: [{ type: String, trim: true }],
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    technicianName: { type: String, trim: true, default: "" },
    cost: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Quoted", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Declined"],
      default: "Pending",
    },
    notes: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
  },
);

const ServiceRecord =
  mongoose.models.ServiceRecord ||
  mongoose.model("ServiceRecord", serviceRecordSchema);

module.exports = ServiceRecord;
