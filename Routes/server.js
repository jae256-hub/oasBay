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

async function notifyAdminOfAccess(req, pageName) {
  if (!req.session?.userId || req.session.role === config.roles.ADMIN) {
    return;
  }

  const actor = await User.findById(req.session.userId).lean();
  if (!actor) {
    return;
  }

  const actorName = `${actor.firstName || ""} ${actor.surname || ""}`.trim();
  const adminUsers = await User.find({ role: config.roles.ADMIN }).lean();
  const accessedAt = new Date().toISOString();

  await Promise.all(
    adminUsers.map((admin) =>
      Notification.create({
        recipient: admin._id,
        message: `${actorName || actor.email} accessed ${pageName} at ${accessedAt}`,
        type: "info",
        metadata: {
          actorId: actor._id,
          actorName: actorName || actor.email,
          actorRole: req.session.role,
          page: pageName,
          accessedAt,
        },
      }),
    ),
  );
}

async function syncPricingFromPayment({ serviceName, description, price }) {
  const name = String(serviceName || "").trim();
  const amount = Number(price || 0);

  if (!name || Number.isNaN(amount)) {
    return null;
  }

  const payload = {
    serviceName: name,
    name,
    description: String(description || `${name} service`),
    price: amount,
    currency: "UGX",
    active: true,
  };

  const existing = await Pricing.findOne({
    serviceName: {
      $regex: new RegExp(
        `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    },
  }).lean();

  if (existing && existing._id) {
    return Pricing.findByIdAndUpdate(existing._id, payload, { new: true });
  }

  return Pricing.create(payload);
}

async function seedDemoData() {
  try {
    const adminEmail = "admin@oyeraautoservicebay.com";
    const technicianEmail = "tech@oyeraautoservicebay.com";
    const seniorEmail = "senior.tech@oyeraautoservicebay.com";

    const admin =
      (await User.findOne({ email: adminEmail })) ||
      (await User.create({
        firstName: "Oyera",
        surname: "Admin",
        role: config.roles.ADMIN,
        email: adminEmail,
        password: await bcrypt.hash("Admin@123", 10),
        telephone: "+256700000001",
      }));

    const technician =
      (await User.findOne({ email: technicianEmail })) ||
      (await User.create({
        firstName: "Tom",
        surname: "Mwangi",
        role: config.roles.TECHNICIAN,
        email: technicianEmail,
        password: await bcrypt.hash("Tech@123", 10),
        telephone: "+256700000002",
      }));

    const senior =
      (await User.findOne({ email: seniorEmail })) ||
      (await User.create({
        firstName: "Sarah",
        surname: "Nakato",
        role: config.roles.SENIOR_TECHNICIAN,
        email: seniorEmail,
        password: await bcrypt.hash("Senior@123", 10),
        telephone: "+256700000003",
      }));

    if ((await ServiceRequest.countDocuments()) === 0) {
      const requests = await ServiceRequest.insertMany([
        {
          carOwnerName: "James Kato",
          carType: "Toyota Corolla",
          problemDescription: "Engine warning light and rough idle.",
          recommendedSolution: "Replace spark plugs and run engine diagnostic.",
          status: "Paid",
          submittedBy: admin._id,
          submittedByName: "Oyera Admin",
          assignedTechnician: technician._id,
          assignedTechnicianName: `${technician.firstName} ${technician.surname}`,
          quotedAmount: "420000",
          quoteNotes: "Spark plug replacement and diagnostics.",
          paymentMethod: "Mtn Mobile Money",
          paymentStatus: "Paid",
        },
        {
          carOwnerName: "Grace Nansubuga",
          carType: "Honda CR-V",
          problemDescription: "Brake squeal and low grip.",
          recommendedSolution: "Replace front brake pads and inspect rotors.",
          status: "Completed",
          submittedBy: senior._id,
          submittedByName: `${senior.firstName} ${senior.surname}`,
          assignedTechnician: technician._id,
          assignedTechnicianName: `${technician.firstName} ${technician.surname}`,
          quotedAmount: "560000",
          quoteNotes: "Brake rotor inspection required.",
          paymentMethod: "MasterCard",
          paymentStatus: "Paid",
        },
        {
          carOwnerName: "Paul Semakula",
          carType: "Mercedes C200",
          problemDescription: "Air conditioning not cooling.",
          recommendedSolution: "Recharge AC gas and check compressor belt.",
          status: "Quoted",
          submittedBy: admin._id,
          submittedByName: "Oyera Admin",
          assignedTechnician: senior._id,
          assignedTechnicianName: `${senior.firstName} ${senior.surname}`,
          quotedAmount: "680000",
          quoteNotes: "AC gas to be checked before refill.",
          paymentMethod: "QR",
          paymentStatus: "Pending",
        },
      ]);

      if ((await ServiceRecord.countDocuments()) === 0) {
        await ServiceRecord.insertMany([
          {
            request: requests[0]._id,
            carOwnerName: requests[0].carOwnerName,
            carType: requests[0].carType,
            problemDescription: requests[0].problemDescription,
            recommendedSolution: requests[0].recommendedSolution,
            partsUsed: ["Spark Plug Set", "Engine Oil"],
            technician: technician._id,
            technicianName: `${technician.firstName} ${technician.surname}`,
            cost: 420000,
            status: "Completed",
            paymentStatus: "Paid",
            notes: "Repair completed and customer notified.",
          },
          {
            request: requests[1]._id,
            carOwnerName: requests[1].carOwnerName,
            carType: requests[1].carType,
            problemDescription: requests[1].problemDescription,
            recommendedSolution: requests[1].recommendedSolution,
            partsUsed: ["Brake Pads", "Rotor Cleaner"],
            technician: technician._id,
            technicianName: `${technician.firstName} ${technician.surname}`,
            cost: 560000,
            status: "Completed",
            paymentStatus: "Paid",
            notes: "Brake pads replaced, brakes tested successfully.",
          },
          {
            request: requests[2]._id,
            carOwnerName: requests[2].carOwnerName,
            carType: requests[2].carType,
            problemDescription: requests[2].problemDescription,
            recommendedSolution: requests[2].recommendedSolution,
            partsUsed: ["AC Gas", "Compressor Belt"],
            technician: senior._id,
            technicianName: `${senior.firstName} ${senior.surname}`,
            cost: 680000,
            status: "In Progress",
            paymentStatus: "Pending",
            notes: "Awaiting customer approval for AC repair.",
          },
        ]);
      }
    }

    if ((await Transaction.countDocuments()) === 0) {
      const requestDocs = await ServiceRequest.find().limit(3).lean();
      const validTxns = requestDocs
        .filter((doc) => doc && doc._id)
        .slice(0, 2)
        .map((doc, index) => ({
          request: doc._id,
          customer: doc.submittedBy || admin._id,
          amount: Number(doc.quotedAmount || 420000 + index * 120000),
          currency: "UGX",
          paymentMethod:
            doc.paymentMethod || ["Mtn Mobile Money", "MasterCard"][index],
          status: "Paid",
          receiptUrl: `/receipts/demo-${index + 1}`,
        }));

      if (validTxns.length) {
        await Transaction.insertMany(validTxns);
      }
    }
  } catch (error) {
    console.error("Demo seed failure:", error.message);
  }
}

// MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(config.mongoUrl, { dbName: config.mongoDbName })
  .then(async () => {
    console.log(`Connected to MongoDB '${config.mongoDbName}'`);
    await seedDemoData();
  })
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

app.get("/serviceRecords", ctrl.authRedirect, async (req, res) => {
  await notifyAdminOfAccess(req, "Service Records");
  res.sendFile(path.join(htmlDir, "serviceRecords.html"));
});
app.get("/inventory", ctrl.authRedirect, async (req, res) => {
  await notifyAdminOfAccess(req, "Inventory");
  res.sendFile(path.join(htmlDir, "inventory.html"));
});
app.get("/userManagement", ctrl.roleGuard(config.roles.ADMIN), (req, res) =>
  res.sendFile(path.join(htmlDir, "userManagement.html")),
);
app.get("/activityLogs", ctrl.roleGuard(config.roles.ADMIN), (req, res) =>
  res.sendFile(path.join(htmlDir, "activityLogs.html")),
);
app.get("/servicePricing", ctrl.roleGuard(config.roles.ADMIN), (req, res) =>
  res.sendFile(path.join(htmlDir, "servicePricing.html")),
);
app.get("/checkout", ctrl.authRedirect, (req, res) =>
  res.sendFile(path.join(htmlDir, "checkout.html")),
);
app.get("/paymentPortal", ctrl.roleGuard(config.roles.ADMIN), (req, res) =>
  res.sendFile(path.join(htmlDir, "adminPayments.html")),
);

// Account: signup
app.post("/signUp", ...ctrl.accountRoutes.signUp, async (req, res) => {
  const { firstName, surname, email, password, telephone } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      surname,
      role: config.roles.TECHNICIAN,
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
    const userPayload = user.toObject();
    delete userPayload.password;
    return res.status(201).json(userPayload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const user = await User.findById(
      req.params.id,
      "firstName surname role email telephone createdAt",
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  },
);
app.put(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const updates = {
        firstName: ctrl.sanitize(req.body.firstName),
        surname: ctrl.sanitize(req.body.surname),
        role: ctrl.sanitize(req.body.role),
        telephone: ctrl.sanitize(req.body.telephone),
      };
      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      })
        .select("firstName surname role email telephone createdAt")
        .lean();
      if (!user) return res.status(404).json({ error: "User not found." });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);
app.delete(
  "/api/users/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found." });
      return res.json({ message: "User removed." });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
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
      const normalizedPrice = Number(price);

      if (
        !safeName ||
        !Number.isFinite(normalizedPrice) ||
        normalizedPrice < 0
      ) {
        return res.status(400).json({
          message: "Item name and a valid, non-negative price are required.",
        });
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
      const safeName = String(name || "").trim();
      const normalizedPrice = Number(price);
      if (
        !safeName ||
        !Number.isFinite(normalizedPrice) ||
        normalizedPrice < 0
      ) {
        return res.status(400).json({
          message: "Item name and a valid, non-negative price are required.",
        });
      }
      const fileItems = readInventoryJson();
      const fileIndex = fileItems.findIndex(
        (item) => String(item.id || item._id) === String(req.params.id),
      );

      if (fileIndex !== -1) {
        const current = fileItems[fileIndex];
        fileItems[fileIndex] = {
          ...current,
          name: safeName,
          description: String(description ?? current.description ?? ""),
          price: normalizedPrice,
          currency: String(currency || current.currency || "UGX"),
          image: String(image ?? current.image ?? ""),
        };
        writeInventoryJson(fileItems);
        return res.json(fileItems[fileIndex]);
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      const updated = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        {
          name: safeName,
          description: String(description || ""),
          price: normalizedPrice,
          currency: String(currency || "UGX"),
          image: String(image || ""),
        },
        { new: true, runValidators: true },
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
      const items = readInventoryJson();
      const remainingItems = items.filter(
        (item) => String(item.id || item._id) !== String(req.params.id),
      );

      if (remainingItems.length !== items.length) {
        writeInventoryJson(remainingItems);
        return res.json({ ok: true, deletedId: req.params.id });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(404).json({ message: "Inventory item not found" });
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
app.post(
  "/api/pricing",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const serviceName = String(
        req.body.serviceName || req.body.name || "",
      ).trim();
      const price = Number(req.body.price);
      if (!serviceName || !Number.isFinite(price) || price < 0) {
        return res
          .status(400)
          .json({ error: "Service name and a valid price are required." });
      }
      const pricing = await Pricing.create({
        ...req.body,
        serviceName,
        price,
      });
      return res.status(201).json(pricing);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);
app.put(
  "/api/pricing/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.serviceName !== undefined || updates.name !== undefined) {
        updates.serviceName = String(
          updates.serviceName || updates.name || "",
        ).trim();
      }
      if (updates.price !== undefined) {
        updates.price = Number(updates.price);
        if (!Number.isFinite(updates.price) || updates.price < 0) {
          return res
            .status(400)
            .json({ error: "Enter a valid, non-negative price." });
        }
      }
      const pricing = await Pricing.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });
      if (!pricing)
        return res.status(404).json({ error: "Pricing plan not found." });
      return res.json(pricing);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);
app.delete(
  "/api/pricing/:id",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    try {
      const pricing = await Pricing.findByIdAndDelete(req.params.id);
      if (!pricing)
        return res.status(404).json({ error: "Pricing plan not found." });
      return res.json({ message: "Deleted" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
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
app.get("/api/records", ctrl.authRedirect, async (req, res) => {
  const query = {};
  if (req.session.role === config.roles.TECHNICIAN) {
    query.technician = req.session.userId;
  }
  if (req.session.role === config.roles.SENIOR_TECHNICIAN) {
    query.$or = [
      { technician: req.session.userId },
      { submittedBy: req.session.userId },
    ];
  }

  const records = await ServiceRecord.find(query)
    .sort({ createdAt: -1 })
    .lean();
  res.json(records);
});
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
app.get(
  "/api/transactions",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const txns = await Transaction.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(
      txns.map(async (txn) => {
        const request = await ServiceRequest.findById(txn.request).lean();
        const customer = await User.findById(txn.customer).lean();
        return {
          ...txn,
          requestName: request
            ? `${request.carOwnerName} - ${request.carType}`
            : "Unknown request",
          customerName: customer
            ? `${customer.firstName} ${customer.surname}`
            : request?.submittedByName || "Unknown customer",
          amount: Number(txn.amount || 0),
        };
      }),
    );
    res.json(enriched);
  },
);

app.post(
  "/api/transactions",
  ctrl.roleGuard(config.roles.ADMIN),
  async (req, res) => {
    const {
      requestId,
      customerId,
      amount,
      paymentMethod,
      status = "Paid",
      serviceName,
      description,
    } = req.body;
    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found." });

    const numericAmount = Number(amount || request.quotedAmount || 0);
    const pricingEntry = await syncPricingFromPayment({
      serviceName: serviceName || request.carType || "General Service",
      description,
      price: numericAmount,
    });

    const txn = await Transaction.create({
      request: request._id,
      customer: customerId || request.submittedBy,
      amount: numericAmount,
      paymentMethod: paymentMethod || request.paymentMethod || "QR",
      status,
    });

    request.paymentStatus = status === "Paid" ? "Paid" : "Pending";
    request.status = status === "Paid" ? "Paid" : request.status;
    await request.save();

    const recordPayload = {
      request: request._id,
      carOwnerName: request.carOwnerName || "Unknown customer",
      carType: request.carType || serviceName || "Unknown vehicle",
      problemDescription:
        request.problemDescription || description || "Payment recorded",
      recommendedSolution: request.recommendedSolution || "",
      partsUsed: [serviceName || "Service payment"],
      technician: request.assignedTechnician || undefined,
      technicianName: request.assignedTechnicianName || "Unassigned",
      cost: numericAmount,
      status: status === "Paid" ? "Completed" : "Pending",
      paymentStatus: status === "Paid" ? "Paid" : "Pending",
      notes: description || `Payment saved for ${serviceName || "service"}`,
    };

    const serviceRecord = await ServiceRecord.findOneAndUpdate(
      { request: request._id },
      recordPayload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({
      message: "Transaction recorded.",
      transaction: txn,
      pricing: pricingEntry,
      serviceRecord,
    });
  },
);

app.post("/api/checkout", ctrl.authRedirect, async (req, res) => {
  const { requestId, paymentMethod } = req.body;
  const reqDoc = await ServiceRequest.findById(requestId);
  if (!reqDoc) return res.status(404).json({ error: "Request not found." });
  const txn = await Transaction.create({
    request: reqDoc._id,
    customer: reqDoc.submittedBy,
    amount: Number(reqDoc.quotedAmount || 0),
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
