const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "UGX" },
    image: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Inventory", inventorySchema);
