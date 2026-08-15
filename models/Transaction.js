const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "UGX", trim: true },
    paymentMethod: {
      type: String,
      enum: ["MasterCard", "Mtn Mobile Money", "Airtel Mobile Money", "QR"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    receiptUrl: { type: String, trim: true, default: "" },
    qrCode: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
  },
);

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
