const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: "UGX" },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const Pricing =
  mongoose.models.Pricing || mongoose.model("Pricing", pricingSchema);
module.exports = Pricing;
