const express = require("express");
const path = require("path");
let db;
let sqlite3;
try {
  sqlite3 = require("sqlite3").verbose();
} catch (e) {
  console.warn(
    "sqlite3 native bindings not available, falling back to JSON store:",
    e.message,
  );
}
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 8000;
const HOST = "localhost";
const publicDir = path.resolve(__dirname, "../public");
const htmlDir = path.resolve(__dirname, "../html");
const dbFile = path.join(__dirname, "../data/oyera.db");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicDir));
app.use("/html", express.static(htmlDir));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.url}`);
  next();
});

// Initialize DB: prefer SQLite, fallback to JSON file-based store
if (sqlite3) {
  db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error("Failed to open database:", err.message);
      process.exit(1);
    }
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      surname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      telephone TEXT
    )`,
      (err) => {
        if (err) console.error("Failed to create users table:", err.message);
      },
    );
  });
} else {
  // Simple JSON fallback to avoid native build requirements during development
  const fs = require("fs");
  const dataDir = path.join(__dirname, "../data");
  const usersFile = path.join(dataDir, "users.json");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile))
    fs.writeFileSync(usersFile, JSON.stringify([]), "utf8");

  const readUsers = () => {
    try {
      return JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]");
    } catch (err) {
      console.warn(
        "Failed to read users.json, resetting storage:",
        err.message,
      );
      fs.writeFileSync(usersFile, JSON.stringify([]), "utf8");
      return [];
    }
  };

  const writeUsers = (arr) =>
    fs.writeFileSync(usersFile, JSON.stringify(arr, null, 2), "utf8");

  db = {
    get(sql, params, cb) {
      const users = readUsers();
      // support simple queries used in this app
      if (/WHERE\s+email\s*=\s*\?/i.test(sql)) {
        const email = params[0];
        const row = users.find((u) => u.email === email);
        return cb(null, row || undefined);
      }
      if (/SELECT\s+id\s+FROM\s+users/i.test(sql)) {
        const email = params[0];
        const row = users.find((u) => u.email === email);
        return cb(null, row ? { id: row.id } : undefined);
      }
      return cb(null, undefined);
    },
    run(sql, params, cb) {
      const users = readUsers();
      if (/INSERT\s+INTO\s+users/i.test(sql)) {
        const [firstName, surname, email, hashed, telephone] = params;
        const id = users.length ? users[users.length - 1].id + 1 : 1;
        const user = {
          id,
          first_name: firstName,
          surname,
          email,
          password: hashed,
          telephone,
        };
        users.push(user);
        writeUsers(users);
        const context = { lastID: id };
        if (cb) return cb(null, context);
        return;
      }
      if (cb) return cb(null);
    },
    all(sql, params, cb) {
      const users = readUsers();
      const out = users.map((u) => ({
        id: u.id,
        first_name: u.first_name,
        surname: u.surname,
        email: u.email,
        telephone: u.telephone,
      }));
      return cb(null, out);
    },
  };
}

// Routes
app.get("/", (req, res) => res.sendFile(path.join(htmlDir, "index.html")));
app.get("/homePage", (req, res) =>
  res.sendFile(path.join(htmlDir, "index.html")),
);

// Single auth page (login + signup)
app.get("/auth", (req, res) =>
  res.sendFile(path.join(htmlDir, "customerAuth.html")),
);
app.get("/customerLogin", (req, res) => res.redirect("/auth"));
app.get("/customerSignUp", (req, res) => res.redirect("/auth"));

app.get("/customerDashboard", (req, res) =>
  res.sendFile(path.join(htmlDir, "customerDashboard.html")),
);
app.get("/vulnerableLogin", (req, res) =>
  res.sendFile(path.join(htmlDir, "vulnerableLogin.html")),
);

// Technician login - basic protected example, sanitized inputs
const technicians = [
  { username: "kato", password: "kato2024", role: "senior_technician" },
  { username: "amina", password: "amina2024", role: "technician" },
  { username: "admin", password: "admin123", role: "admin" },
];

app.post(
  "/login",
  [body("username").trim().escape(), body("password").trim().escape()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    const row = technicians.find(
      (t) => t.username === username && t.password === password,
    );
    if (row)
      return res.json({ message: `Welcome ${row.username}`, role: row.role });
    return res.status(401).json({ error: "Invalid login" });
  },
);

// Customer signup
app.post(
  "/customerSignUp",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name required")
      .escape(),
    body("surname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Surname required")
      .escape(),
    body("email")
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("telephone")
      .optional({ checkFalsy: true })
      .isMobilePhone()
      .withMessage("Invalid telephone number"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { firstName, surname, email, password, telephone } = req.body;

    // Check existing user
    db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (row) return res.status(409).json({ error: "User already exists" });

      const hashed = bcrypt.hashSync(password, 10);
      const stmt =
        "INSERT INTO users (first_name, surname, email, password, telephone) VALUES (?, ?, ?, ?, ?)";
      db.run(
        stmt,
        [firstName, surname, email, hashed, telephone || null],
        function (err2) {
          if (err2)
            return res.status(500).json({ error: "Failed to create user" });
          return res
            .status(201)
            .json({ message: "User created", userId: this.lastID });
        },
      );
    });
  },
);

// Customer login
app.post(
  "/customerLogin",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      const match = bcrypt.compareSync(password, row.password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });
      // In a real app, issue a session or JWT here
      return res.json({
        message: `Welcome ${row.first_name} ${row.surname}`,
        userId: row.id,
      });
    });
  },
);

app.post("/customerDashboard", (req, res) => {
  console.log("Customer Dashboard accessed:", req.body);
  res.status(200).json({
    message: "Customer access to dashboard received successfully.",
    data: req.body,
  });
});

app.post("/vulnerableLogin", (req, res) => {
  console.log("Technician login accessed.");
  res.status(200).json({
    message: "Technician Login received successfully.",
    data: req.body,
  });
});

app.get("/api/users", (req, res) => {
  db.all(
    "SELECT id, first_name, surname, email, telephone FROM users",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows);
    },
  );
});

app.use((req, res) => res.status(404).send("Page not found."));

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
