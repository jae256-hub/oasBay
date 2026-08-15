// Server entry — REST routes, session auth, and simple HTML pages
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const config = require("./config");
const ctrl = require("./controllers");

const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceRecord = require("../models/ServiceRecord");
const InventoryItem = require("../models/InventoryItem");
const Pricing = require("../models/Pricing");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = "localhost";
const publicDir = path.resolve(__dirname, "../public");
const htmlDir = path.resolve(__dirname, "../html");
const inventoryJsonPath = path.resolve(__dirname, "../inventory.json");

function readInventoryJson() {
  try {
    const raw = fs.readFileSync(inventoryJsonPath, "utf8");
    return JSON.parse(raw || "[]");
  } catch (error) {
    return [];
  }
}

function writeInventoryJson(items) {
  fs.writeFileSync(inventoryJsonPath, JSON.stringify(items, null, 2));
}

async function getInventoryList() {
  const fileItems = readInventoryJson();
  const dbItems =
    mongoose.connection.readyState === 1
      ? await InventoryItem.find().lean()
      : [];
  const merged = [...fileItems, ...dbItems];
  const unique = new Map();

  for (const item of merged) {
    const key = String(item._id || item.id || `${item.name}-${item.price}`);
    unique.set(key, item);
  }

  return [...unique.values()];
}

// MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(config.mongoUrl, { dbName: config.mongoDbName })
  .then(() => console.log(`Connected to MongoDB '${config.mongoDbName}'`))
  .catch((err) => console.error("MongoDB Connection error:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "oyera-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);
app.use(express.static(publicDir));
app.use("/html", express.static(htmlDir));
app.use("/css", express.static(publicDir));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Simple HTML routes
app.get("/", (req, res) => res.redirect("/homePage"));
app.get("/homePage", (req, res) =>
  res.sendFile(path.join(htmlDir, "index.html")),
);
app.get("/login", (req, res) => {
  if (req.session?.userId)
    return res.redirect(ctrl.buildRoleRedirect(req.session.role));
  res.sendFile(path.join(htmlDir, "login.html"));
});
app.get("/signUp", (req, res) =>
  res.sendFile(path.join(htmlDir, "signUp.html")),
);
app.get("/logout", (req, res) =>
  req.session.destroy(() => res.redirect("/login")),
);

app.get("/adminDashboard", ctrl.roleGuard(config.roles.ADMIN), (req, res) =>
  res.sendFile(path.join(htmlDir, "adminDashboard.html")),
);
app.get(
  "/technicianDashboard",
  ctrl.roleGuard(config.roles.TECHNICIAN),
  (req, res) => res.sendFile(path.join(htmlDir, "technicianDashboard.html")),
);
app.get(
  "/seniorTechnicianDashboard",
  ctrl.roleGuard(config.roles.SENIOR_TECHNICIAN),
  (req, res) =>
    res.sendFile(path.join(htmlDir, "seniorTechnicianDashboard.html")),
);

app.get("/serviceRecords", (req, res) =>
  res.sendFile(path.join(htmlDir, "serviceRecords.html")),
);
app.get("/inventory", (req, res) =>
  res.sendFile(path.join(htmlDir, "inventory.html")),
);
app.get("/userManagement", ctrl.authRedirect, (req, res) =>
  res.sendFile(path.join(htmlDir, "userManagement.html")),
);
app.get("/activityLogs", ctrl.authRedirect, (req, res) =>
  res.sendFile(path.join(htmlDir, "activityLogs.html")),
);
app.get("/servicePricing", ctrl.authRedirect, (req, res) =>
  res.sendFile(path.join(htmlDir, "servicePricing.html")),
);
app.get("/checkout", ctrl.authRedirect, (req, res) =>
  res.sendFile(path.join(htmlDir, "checkout.html")),
);

// Account: signup
app.post("/signUp", ...ctrl.accountRoutes.signUp, async (req, res) => {
  const { firstName, surname, role, email, password, telephone } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      surname,
      role,
      email,
      password: hashed,
      telephone,
    });
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = `${user.firstName} ${user.surname}`;
    return res.status(201).json({
      message: "Signup successful.",
      redirect: ctrl.buildRoleRedirect(user.role),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unable to create user." });
  }
});

// Account: login
app.post(
  "/login",
  body("emailOrPhone").trim().notEmpty().withMessage("Email or phone required"),
  body("password").trim().isLength({ min: 1 }).withMessage("Password required"),
  ctrl.validate,
  async (req, res) => {
    const { emailOrPhone, password } = req.body;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
      const query = emailPattern.test(emailOrPhone)
        ? { email: emailOrPhone.toLowerCase() }
        : { telephone: emailOrPhone };
      const user = await User.findOne(query);
      if (!user) return res.status(401).json({ error: "Invalid credentials." });
      const matched = await bcrypt.compare(password, user.password);
      if (!matched)
        return res.status(401).json({ error: "Invalid credentials." });
      req.session.userId = user._id;
      req.session.role = user.role;
      req.session.name = `${user.firstName} ${user.surname}`;
      return res.json({
        message: `Welcome back, ${user.firstName}.`,
        redirect: ctrl.buildRoleRedirect(user.role),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Login failed." });
    }
  },
);
// Users (admin)
app.get("/api/users", ctrl.roleGuard(config.roles.ADMIN), async (req, res) =>
  res.json(
    await User.find(
      {},
      "firstName surname role email telephone createdAt",
    ).lean(),
  ),
);
app.post("/api/users", ctrl.roleGuard(config.roles.ADMIN), async (req, res) => {
  try {
    const { firstName, surname, role, email, password, telephone } = req.body;
    if (!firstName || !surname || !email || !password || !telephone) {
      return res
        .status(400)
        .json({ error: "All required fields are required." });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      surname,
      role: role || config.roles.TECHNICIAN,
      email: String(email).toLowerCase(),
      password: hashed,
      telephone,
    });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  },
);
app.put(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const updates = {
      firstName: ctrl.sanitize(req.body.firstName),
      surname: ctrl.sanitize(req.body.surname),
      role: ctrl.sanitize(req.body.role),
      telephone: ctrl.sanitize(req.body.telephone),
    };
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).lean();
    res.json(user || { error: "User not found." });
  },
);
app.delete(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed." });
  },
);

app.get(
  "/api/activity-logs",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const recent = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const mapped = recent.map((item) => ({
      _id: item._id,
      action: item.type || "Activity",
      message: item.message || "System activity",
      actor: item.recipient ? "System" : "Admin",
      timestamp: item.createdAt,
    }));
    res.json(mapped);
  },
);

// Inventory
app.get("/api/inventory/json", async (req, res) => {
  res.json(readInventoryJson());
});

app.get("/api/inventory", async (req, res) => {
  try {
    const items = await getInventoryList();
    res.json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Inventory load failed", error: error.message });
  }
});

app.post(
  "/api/inventory",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const { name, description, price, currency, image } = req.body;
      const safeName = String(name || "").trim();
      const normalizedPrice = Number(price || 0);

      if (!safeName || Number.isNaN(normalizedPrice)) {
        return res
          .status(400)
          .json({ message: "Item name and price are required." });
      }

      const itemPayload = {
        name: safeName,
        description: String(description || ""),
        price: normalizedPrice,
        currency: String(currency || "UGX"),
        image: String(image || ""),
      };

      if (mongoose.connection.readyState !== 1) {
        const items = readInventoryJson();
        const item = { id: Date.now(), ...itemPayload };
        items.push(item);
        writeInventoryJson(items);
        return res.status(201).json(item);
      }

      const item = await InventoryItem.create(itemPayload);
      return res.status(201).json({
        _id: item._id,
        id: String(item._id),
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        image: item.image,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Inventory add failed", error: error.message });
    }
  },
);

app.put(
  "/api/inventory/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const { name, description, price, currency, image } = req.body;

      if (mongoose.connection.readyState !== 1) {
        const items = readInventoryJson();
        const index = items.findIndex(
          (item) => String(item.id || item._id) === String(req.params.id),
        );
        if (index === -1) {
          return res.status(404).json({ message: "Inventory item not found" });
        }

        items[index] = {
          ...items[index],
          name: String(name || items[index].name),
          description: String(description || items[index].description || ""),
          price: Number(price || items[index].price || 0),
          currency: String(currency || items[index].currency || "UGX"),
          image: String(image || items[index].image || ""),
        };
        writeInventoryJson(items);
        return res.json(items[index]);
      }

      const updated = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        {
          name: String(name || ""),
          description: String(description || ""),
          price: Number(price || 0),
          currency: String(currency || "UGX"),
          image: String(image || ""),
        },
        { new: true },
      );

      if (!updated) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      return res.json(updated);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Inventory update failed", error: error.message });
    }
  },
);

app.delete(
  "/api/inventory/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        const items = readInventoryJson();
        const filtered = items.filter(
          (item) => String(item.id || item._id) !== String(req.params.id),
        );
        writeInventoryJson(filtered);
        return res.json({ ok: true, deletedId: req.params.id });
      }

      const deleted = await InventoryItem.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      return res.json({ ok: true, deletedId: req.params.id });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Inventory delete failed", error: error.message });
    }
  },
);

// Pricing
app.get("/api/pricing", ctrl.roleGuard(), async (req, res) =>
  res.json(await Pricing.find().lean()),
);
app.post("/api/pricing", ctrl.roleGuard(config.roles.ADMIN), async (req, res) =>
  res.status(201).json(await Pricing.create(req.body)),
);
app.put(
  "/api/pricing/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) =>
    res.json(
      await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true }),
    ),
);
app.delete(
  "/api/pricing/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    await Pricing.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  },
);

// Service requests / quoting / assignment
app.get("/api/requests", ctrl.authRedirect, async (req, res) => {
  const query = {};
  if (req.session.role === config.roles.TECHNICIAN)
    query.assignedTechnician = req.session.userId;
  if (req.session.role === config.roles.SENIOR_TECHNICIAN)
    query.submittedBy = req.session.userId;
  res.json(await ServiceRequest.find(query).sort({ createdAt: -1 }).lean());
});
app.post(
  "/api/requests",
  ctrl.roleGuard(config.roles.SENIOR_TECHNICIAN),
  ...ctrl.accountRoutes.request,
  async (req, res) => {
    const { carOwnerName, carType, problemDescription, recommendedSolution } =
      req.body;
    const request = await ServiceRequest.create({
      carOwnerName,
      carType,
      problemDescription,
      recommendedSolution,
      submittedBy: req.session.userId,
      submittedByName: req.session.name,
    });
    await Notification.create({
      recipient: req.session.userId,
      message: `New service request submitted: ${request._id}`,
      type: "action_required",
      relatedRequest: request._id,
    });
    res.status(201).json(request);
  },
);
app.post(
  "/api/requests/:id/quote",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const { quotedAmount, assignedTechnicianId, quoteNotes } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Not found" });
    request.status = "Quoted";
    request.quotedAmount = quotedAmount;
    request.quoteNotes = quoteNotes || "";
    if (assignedTechnicianId) {
      request.assignedTechnician = assignedTechnicianId;
      const tech = await User.findById(assignedTechnicianId);
      request.assignedTechnicianName = tech
        ? `${tech.firstName} ${tech.surname}`
        : "";
      await Notification.create({
        recipient: assignedTechnicianId,
        message: `You have been assigned request ${request._id}`,
        type: "action_required",
        relatedRequest: request._id,
      });
    }
    await request.save();
    res.json(request);
  },
);

// Service records
app.get("/api/records", ctrl.authRedirect, async (req, res) =>
  res.json(await ServiceRecord.find().lean()),
);
app.post("/api/records", ctrl.roleGuard(config.roles.ADMIN), async (req, res) =>
  res.status(201).json(await ServiceRecord.create(req.body)),
);
app.put(
  "/api/records/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) =>
    res.json(
      await ServiceRecord.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }),
    ),
);
app.delete(
  "/api/records/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    await ServiceRecord.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  },
);

// Checkout / transaction
app.post("/api/checkout", ctrl.authRedirect, async (req, res) => {
  const { requestId, paymentMethod } = req.body;
  const reqDoc = await ServiceRequest.findById(requestId);
  if (!reqDoc) return res.status(404).json({ error: "Request not found." });
  const txn = await Transaction.create({
    request: reqDoc._id,
    customer: reqDoc.submittedBy,
    amount: reqDoc.quotedAmount || 0,
    paymentMethod,
    status: "Paid",
  });
  reqDoc.paymentStatus = "Paid";
  reqDoc.status = "Paid";
  await reqDoc.save();
  txn.receiptUrl = `/receipts/${txn._id}`;
  await txn.save();
  res.json({ message: "Payment completed.", transaction: txn });
});

// Notifications
app.get("/api/notifications", ctrl.authRedirect, async (req, res) =>
  res.json(
    await Notification.find({ recipient: req.session.userId })
      .sort({ createdAt: -1 })
      .lean(),
  ),
);
app.post("/api/notifications/:id/read", ctrl.authRedirect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ message: "Marked read" });
});

app.use((req, res) => res.status(404).send("Page not found."));

app.listen(PORT, HOST, () =>
  console.log(`Server running http://${HOST}:${PORT}`),
);
