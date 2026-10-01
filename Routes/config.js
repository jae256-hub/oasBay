const path = require("path");

module.exports = {
  mongoDbName: process.env.DATABASE_NAME || "Oyera_Auto_Service_Bay",
  mongoUrl:
    process.env.DATABASE_URL ||
    process.env.DATABASE ||
    "mongodb://127.0.0.1:27017",
  roles: {
    ADMIN: "Admin",
    TECHNICIAN: "Technician",
    SENIOR_TECHNICIAN: "Senior Technician",
  },
  validPaymentMethods: [
    "MasterCard",
    "Mtn Mobile Money",
    "Airtel Mobile Money",
    "QR",
  ],
  inventoryFile: path.resolve(__dirname, "../inventory.json"),
};
