const path = require("path");
const fs = require("fs/promises");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceRecord = require("../models/ServiceRecord");
const InventoryItem = require("../models/InventoryItem");
const Pricing = require("../models/Pricing");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const config = require("./config");

const sanitize = (value) => (typeof value === "string" ? value.trim() : value);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const buildRoleRedirect = (role) => {
  if (role === config.roles.ADMIN) return "/adminDashboard";
  if (role === config.roles.TECHNICIAN) return "/technicianDashboard";
  if (role === config.roles.SENIOR_TECHNICIAN)
    return "/seniorTechnicianDashboard";
  return "/login";
};

const currentUser = (req) => ({
  id: req.session?.userId,
  role: req.session?.role,
  name: req.session?.name,
});

const isAdmin = (req) => req.session?.role === config.roles.ADMIN;

const isTechnician = (req) => req.session?.role === config.roles.TECHNICIAN;

const isSeniorTechnician = (req) =>
  req.session?.role === config.roles.SENIOR_TECHNICIAN;

const authRedirect = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }
  next();
};

const roleGuard = (requiredRole) => (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }
  if (requiredRole && req.session.role !== requiredRole) {
    return res.status(403).json({ error: "Access denied." });
  }
  next();
};

const getInventoryFromJson = async () => {
  const file = config.inventoryFile;
  const text = await fs.readFile(file, "utf8");
  return JSON.parse(text);
};

const getUserPayload = (req, user) => ({
  id: user._id,
  firstName: user.firstName,
  surname: user.surname,
  role: user.role,
  email: user.email,
  telephone: user.telephone,
  createdAt: user.createdAt,
  dashboard: buildRoleRedirect(user.role),
  isAdmin: user.role === config.roles.ADMIN,
});

const accountRoutes = {
  signUp: [
    body("firstName").trim().notEmpty().withMessage("First name is required."),
    body("surname").trim().notEmpty().withMessage("Surname is required."),
    body("role").isIn(Object.values(config.roles)),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("telephone")
      .trim()
      .matches(/^\+?[0-9\s-]{7,15}$/)
      .withMessage("Invalid telephone number."),
    validate,
  ],
  request: [
    body("carOwnerName")
      .trim()
      .notEmpty()
      .withMessage("Owner name is required."),
    body("carType").trim().notEmpty().withMessage("Car type is required."),
    body("problemDescription")
      .trim()
      .notEmpty()
      .withMessage("Problem description is required."),
    body("recommendedSolution")
      .trim()
      .notEmpty()
      .withMessage("Recommended solution is required."),
    validate,
  ],
};

module.exports = {
  validate,
  currentUser,
  isAdmin,
  isTechnician,
  isSeniorTechnician,
  authRedirect,
  roleGuard,
  buildRoleRedirect,
  getInventoryFromJson,
  getUserPayload,
  sanitize,
  accountRoutes,
};
