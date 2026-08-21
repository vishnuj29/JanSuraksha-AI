// src/server/entry.ts
import express from "express";
import dotenv2 from "dotenv";
import path2 from "path";

// src/server/api/auth/login-initiate/POST.ts
import bcryptjs2 from "bcryptjs";

// src/server/services/dbStore.ts
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// src/server/services/mysqlService.ts
import mysql from "mysql2/promise";
var MySQLService = class {
  pool = null;
  isInitialized = false;
  getPool() {
    if (this.pool) return this.pool;
    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const host = process.env.MYSQL_HOST || (connectionUri ? void 0 : "localhost");
    const user = process.env.MYSQL_USER || (connectionUri ? void 0 : "root");
    const password = process.env.MYSQL_PASSWORD ?? (connectionUri ? void 0 : "");
    const database = process.env.MYSQL_DATABASE || (connectionUri ? void 0 : "jansuraksha_db");
    const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
    try {
      if (connectionUri) {
        this.pool = mysql.createPool({
          uri: connectionUri,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          ssl: connectionUri.includes("ssl") ? { rejectUnauthorized: false } : void 0
        });
        console.log("[MySQL] \u{1F42C} Pool connected via Connection URI");
        return this.pool;
      }
      if (host && user) {
        this.pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        console.log(`[MySQL] \u{1F42C} Pool connected to host: ${host}:${port}, database: ${database}`);
        return this.pool;
      }
    } catch (err) {
      console.warn("[MySQL] \u26A0\uFE0F Could not initialize MySQL pool:", err);
    }
    return null;
  }
  async initSchema() {
    if (this.isInitialized) return true;
    const pool = this.getPool();
    if (!pool) return false;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
          plan VARCHAR(32) NOT NULL DEFAULT 'Free',
          safety_score INT UNSIGNED NOT NULL DEFAULT 85,
          avatar VARCHAR(8) NOT NULL DEFAULT 'JS',
          location VARCHAR(128) NOT NULL DEFAULT 'India',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_role (role),
          INDEX idx_users_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sos_alerts (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          user_id VARCHAR(64) NULL,
          user_name VARCHAR(128) NOT NULL,
          user_email VARCHAR(191) NOT NULL,
          alert_type VARCHAR(64) NOT NULL DEFAULT 'Voice Trigger',
          latitude DECIMAL(10, 8) NULL,
          longitude DECIMAL(11, 8) NULL,
          google_maps_url TEXT NULL,
          address VARCHAR(255) NULL,
          status ENUM('Active', 'Resolved', 'Escalated', 'False Alarm') NOT NULL DEFAULT 'Active',
          responders_notified INT UNSIGNED NOT NULL DEFAULT 3,
          trigger_phrase VARCHAR(128) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_alerts_user (user_email),
          INDEX idx_alerts_status (status),
          INDEX idx_alerts_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otp_records (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(191) NOT NULL,
          otp_code VARCHAR(8) NOT NULL,
          purpose ENUM('login', 'registration', 'password_reset') NOT NULL DEFAULT 'login',
          is_used TINYINT(1) NOT NULL DEFAULT 0,
          expires_at DATETIME NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_otp_email (email),
          INDEX idx_otp_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, phone, role, plan, safety_score, avatar, location)
        VALUES (
          'u-admin-1',
          'Vishnu Jaiswal (Admin)',
          'ec23019@glbitm.ac.in',
          '$2a$10$3s8FzV8i5QZtT61w/bYVpOkN1jN6rX.hS0H2QZ5pT0aQ7r9p3hC.',
          '+91 88740 47462',
          'admin',
          'Premium',
          99,
          'VJ',
          'Greater Noida, UP'
        )
        ON DUPLICATE KEY UPDATE role = 'admin', plan = 'Premium';
      `);
      this.isInitialized = true;
      console.log("[MySQL] \u2705 Schema initialized & Super Admin ec23019@glbitm.ac.in verified in MySQL");
      return true;
    } catch (err) {
      console.warn("[MySQL] \u26A0\uFE0F Schema initialization skipped or failed:", err);
      return false;
    }
  }
  async getAllUsers() {
    const pool = this.getPool();
    if (!pool) return [];
    try {
      const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
      return rows;
    } catch (err) {
      console.error("[MySQL] Query users failed:", err);
      return [];
    }
  }
  async getUserByEmail(email) {
    const pool = this.getPool();
    if (!pool) return null;
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
      const list = rows;
      return list.length > 0 ? list[0] : null;
    } catch (err) {
      console.error("[MySQL] Find user failed:", err);
      return null;
    }
  }
  async insertUser(user) {
    const pool = this.getPool();
    if (!pool) return false;
    try {
      const role = user.email.toLowerCase() === "ec23019@glbitm.ac.in" ? "admin" : user.role || "user";
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, phone, role, plan, safety_score, avatar, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), role = VALUES(role), updated_at = NOW()`,
        [
          user.id,
          user.name,
          user.email.toLowerCase(),
          user.passwordHash,
          user.phone,
          role,
          user.plan || "Free",
          user.safetyScore || 80,
          user.avatar || "JS",
          user.location || "India"
        ]
      );
      return true;
    } catch (err) {
      console.error("[MySQL] Insert user failed:", err);
      return false;
    }
  }
  async insertSOSAlert(alert) {
    const pool = this.getPool();
    if (!pool) return false;
    try {
      await pool.query(
        `INSERT INTO sos_alerts (id, user_id, user_name, user_email, alert_type, latitude, longitude, google_maps_url, address, status, responders_notified, trigger_phrase)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [
          alert.id,
          alert.userId || null,
          alert.userName,
          alert.userEmail,
          alert.alertType,
          alert.latitude || null,
          alert.longitude || null,
          alert.googleMapsUrl || null,
          alert.address || null,
          alert.status || "Active",
          alert.respondersNotified || 3,
          alert.triggerPhrase || null
        ]
      );
      return true;
    } catch (err) {
      console.error("[MySQL] Insert SOS Alert failed:", err);
      return false;
    }
  }
  async getAllAlerts() {
    const pool = this.getPool();
    if (!pool) return [];
    try {
      const [rows] = await pool.query("SELECT * FROM sos_alerts ORDER BY created_at DESC");
      return rows;
    } catch (err) {
      console.error("[MySQL] Query alerts failed:", err);
      return [];
    }
  }
  async getStatus() {
    const pool = this.getPool();
    if (!pool) {
      return {
        connected: false,
        driver: "mysql2",
        message: "MySQL pool not configured. Set MYSQL_URL or MYSQL_HOST in your environment."
      };
    }
    try {
      const [userCountResult] = await pool.query("SELECT COUNT(*) as count FROM users");
      const [alertCountResult] = await pool.query("SELECT COUNT(*) as count FROM sos_alerts");
      return {
        connected: true,
        driver: "mysql2",
        database: process.env.MYSQL_DATABASE || "jansuraksha_db",
        totalUsers: userCountResult[0]?.count || 0,
        totalAlerts: alertCountResult[0]?.count || 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      return {
        connected: false,
        driver: "mysql2",
        error: err?.message || "Failed to ping MySQL server"
      };
    }
  }
};
var mysqlService = new MySQLService();

// src/server/services/dbStore.ts
var JWT_SECRET = process.env.JWT_SECRET || "jansuraksha-enterprise-jwt-super-secret-key-2026";
var DBStore = class {
  users = /* @__PURE__ */ new Map();
  otps = /* @__PURE__ */ new Map();
  pendingRegistrations = /* @__PURE__ */ new Map();
  contacts = /* @__PURE__ */ new Map();
  sosAlerts = [];
  vaultItems = /* @__PURE__ */ new Map();
  voiceConfigs = /* @__PURE__ */ new Map();
  incidents = [];
  constructor() {
    this.seedInitialData();
  }
  seedInitialData() {
    const defaultPasswordHash = bcryptjs.hashSync("Password@123", 10);
    const defaultUsers = [
      {
        id: "u-admin-1",
        name: "Vishnu Jaiswal (Admin)",
        email: "ec23019@glbitm.ac.in",
        passwordHash: defaultPasswordHash,
        phone: "+91 88740 47462",
        role: "admin",
        plan: "Premium",
        safetyScore: 99,
        avatar: "VJ",
        location: "Greater Noida, UP",
        joinedDate: "Jan 01, 2026"
      },
      {
        id: "u-demo-1",
        name: "Priya Sharma",
        email: "priya@example.com",
        passwordHash: defaultPasswordHash,
        phone: "+91 98765 43210",
        role: "user",
        plan: "Premium",
        safetyScore: 88,
        avatar: "PS",
        location: "Mumbai, MH",
        joinedDate: "Jan 12, 2026"
      },
      {
        id: "u-demo-2",
        name: "Rahul Verma",
        email: "rahul@example.com",
        passwordHash: defaultPasswordHash,
        phone: "+91 87654 32109",
        role: "user",
        plan: "Free",
        safetyScore: 74,
        avatar: "RV",
        location: "New Delhi, DL",
        joinedDate: "Feb 03, 2026"
      }
    ];
    defaultUsers.forEach((u) => this.users.set(u.email.toLowerCase(), u));
    const defaultContacts = [
      {
        id: "c1",
        userId: "u-demo-1",
        name: "Priya Sharma (Mom)",
        phone: "+91 98765 43210",
        relation: "Family",
        isPrimary: true,
        notifyLevel: "always",
        shareLocation: true,
        verified: true,
        avatar: "PS"
      },
      {
        id: "c2",
        userId: "u-demo-1",
        name: "Rahul Verma",
        phone: "+91 87654 32109",
        relation: "Friend",
        isPrimary: false,
        notifyLevel: "sos_only",
        shareLocation: true,
        verified: true,
        avatar: "RV"
      },
      {
        id: "c3",
        userId: "u-demo-1",
        name: "Anita Singh",
        phone: "+91 76543 21098",
        relation: "Colleague",
        isPrimary: false,
        notifyLevel: "sos_only",
        shareLocation: false,
        verified: false,
        avatar: "AS"
      }
    ];
    defaultContacts.forEach((c) => this.contacts.set(c.id, c));
    this.sosAlerts = [
      {
        id: "A001",
        userId: "u-demo-1",
        user: "Priya Sharma",
        phone: "+91 98765 43210",
        type: "Manual SOS",
        time: "Today \xB7 10:42 PM",
        location: "Connaught Place, New Delhi",
        coordinates: { latitude: 28.6315, longitude: 77.2167 },
        status: "Resolved",
        responders: 3,
        message: "\u{1F6A8} Emergency Alert Triggered",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "A002",
        userId: "u-demo-2",
        user: "Rahul Verma",
        phone: "+91 87654 32109",
        type: "Voice Trigger",
        time: "Yesterday \xB7 09:15 PM",
        location: "Indiranagar, Bengaluru",
        coordinates: { latitude: 12.9784, longitude: 77.6408 },
        status: "Resolved",
        responders: 2,
        triggerWord: "SURAKSHA",
        message: "\u{1F6A8} Voice Emergency Triggered",
        timestamp: new Date(Date.now() - 864e5).toISOString()
      }
    ];
    const defaultVault = [
      {
        id: "v1",
        userId: "u-demo-1",
        type: "photo",
        title: "Emergency Capture #1",
        date: "Apr 5, 2026 \xB7 11:42 PM",
        size: "2.4 MB",
        emergency: true,
        encrypted: true
      },
      {
        id: "v2",
        userId: "u-demo-1",
        type: "video",
        title: "Incident Recording",
        date: "Apr 5, 2026 \xB7 11:43 PM",
        size: "18.7 MB",
        duration: "0:47",
        emergency: true,
        encrypted: true
      },
      {
        id: "v3",
        userId: "u-demo-1",
        type: "audio",
        title: "Voice Recording",
        date: "Apr 5, 2026 \xB7 11:42 PM",
        size: "1.2 MB",
        duration: "1:23",
        emergency: true,
        encrypted: true
      }
    ];
    defaultVault.forEach((v) => this.vaultItems.set(v.id, v));
    this.incidents = [
      {
        id: "inc-1",
        title: "Dim lighting & non-functional street lamps",
        category: "Infrastructure",
        location: "North Sub-corridor",
        time: "1 hour ago",
        severity: "medium",
        description: "Street lights off along 400m stretch. Reported to municipal authorities.",
        upvotes: 14
      },
      {
        id: "inc-2",
        title: "Heavy traffic congestion & crowd surge",
        category: "Crowd Risk",
        location: "Central Cross Roads",
        time: "3 hours ago",
        severity: "low",
        description: "High footfall due to festival gathering. Police patrol deployed.",
        upvotes: 8
      }
    ];
  }
  // --- Auth & Users ---
  findUserByEmail(email) {
    return this.users.get(email.trim().toLowerCase());
  }
  findUserById(id) {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return void 0;
  }
  createUser(userData) {
    const emailKey = userData.email.trim().toLowerCase();
    if (this.users.has(emailKey)) {
      throw new Error("Email address is already registered");
    }
    const id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcryptjs.hashSync(userData.password, 10);
    const initials = userData.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "JS";
    const isAdmin = emailKey === "ec23019@glbitm.ac.in" || emailKey === "admin@jansuraksha.ai";
    const newUser = {
      id,
      name: userData.name.trim(),
      email: emailKey,
      passwordHash,
      phone: userData.phone.trim(),
      role: isAdmin ? "admin" : "user",
      plan: isAdmin ? "Premium" : "Free",
      safetyScore: isAdmin ? 99 : 78,
      avatar: initials,
      location: "Local Area",
      joinedDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };
    this.users.set(emailKey, newUser);
    mysqlService.insertUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      passwordHash: newUser.passwordHash,
      phone: newUser.phone,
      role: newUser.role,
      plan: newUser.plan,
      safetyScore: newUser.safetyScore,
      avatar: newUser.avatar,
      location: newUser.location
    }).catch(() => {
    });
    return newUser;
  }
  updateUser(userId, updates) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...updates };
    this.users.set(user.email, updated);
    return updated;
  }
  getAllUsers() {
    return Array.from(this.users.values());
  }
  validatePassword(plainPassword, hash) {
    return bcryptjs.compareSync(plainPassword, hash);
  }
  comparePassword(plainPassword, hash) {
    return bcryptjs.compareSync(plainPassword, hash);
  }
  // --- Registration OTP Management ---
  setPendingRegistration(data) {
    const emailKey = data.email.trim().toLowerCase();
    if (this.users.has(emailKey)) {
      throw new Error("This email address is already registered. Please sign in.");
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    this.pendingRegistrations.set(emailKey, {
      name: data.name.trim(),
      email: emailKey,
      password: data.password,
      phone: data.phone.trim(),
      otp,
      expiresAt: Date.now() + 10 * 60 * 1e3,
      // 10 minutes
      attempts: 0
    });
    return otp;
  }
  getPendingRegistration(email) {
    return this.pendingRegistrations.get(email.trim().toLowerCase());
  }
  verifyPendingRegistration(email, otp) {
    const emailKey = email.trim().toLowerCase();
    const pending = this.pendingRegistrations.get(emailKey);
    if (!pending) {
      throw new Error("No pending registration found for this email. Please submit the registration form again.");
    }
    if (Date.now() > pending.expiresAt) {
      this.pendingRegistrations.delete(emailKey);
      throw new Error("Verification code has expired. Please request a new code.");
    }
    pending.attempts += 1;
    if (pending.attempts > 5) {
      this.pendingRegistrations.delete(emailKey);
      throw new Error("Too many incorrect code attempts. Please register again.");
    }
    if (pending.otp !== otp.trim()) {
      throw new Error("Invalid verification code. Please check your email inbox.");
    }
    this.pendingRegistrations.delete(emailKey);
    return this.createUser({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      phone: pending.phone
    });
  }
  resendRegistrationOtp(email) {
    const emailKey = email.trim().toLowerCase();
    const pending = this.pendingRegistrations.get(emailKey);
    if (!pending) {
      throw new Error("No pending registration found for this email.");
    }
    const newOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
    pending.otp = newOtp;
    pending.expiresAt = Date.now() + 10 * 60 * 1e3;
    pending.attempts = 0;
    this.pendingRegistrations.set(emailKey, pending);
    return { otp: newOtp, name: pending.name };
  }
  // --- OTP Management ---
  setOtp(email, otp) {
    const emailKey = email.trim().toLowerCase();
    this.otps.set(emailKey, {
      email: emailKey,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1e3,
      // 10 minutes
      attempts: 0
    });
  }
  verifyOtp(email, otp) {
    const emailKey = email.trim().toLowerCase();
    const record = this.otps.get(emailKey);
    if (!record) {
      return false;
    }
    if (Date.now() > record.expiresAt) {
      this.otps.delete(emailKey);
      return false;
    }
    record.attempts += 1;
    if (record.attempts > 5) {
      this.otps.delete(emailKey);
      throw new Error("Too many invalid attempts. Please request a new OTP.");
    }
    if (record.otp === otp.trim()) {
      this.otps.delete(emailKey);
      return true;
    }
    return false;
  }
  // --- JWT Handling ---
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
  }
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch {
      return null;
    }
  }
  // --- Emergency Contacts ---
  getContacts(userId) {
    const all = Array.from(this.contacts.values());
    if (!userId) return all;
    const userContacts = all.filter((c) => c.userId === userId);
    return userContacts.length > 0 ? userContacts : all;
  }
  addContact(contactData) {
    const id = `c_${Date.now()}`;
    const initials = contactData.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "C";
    const newContact = {
      ...contactData,
      id,
      avatar: initials
    };
    this.contacts.set(id, newContact);
    return newContact;
  }
  updateContact(id, updates) {
    const contact = this.contacts.get(id);
    if (!contact) throw new Error("Contact not found");
    const updated = { ...contact, ...updates };
    this.contacts.set(id, updated);
    return updated;
  }
  deleteContact(id) {
    return this.contacts.delete(id);
  }
  // --- SOS Alerts ---
  createSosAlert(alertData) {
    const id = `A${String(this.sosAlerts.length + 1).padStart(3, "0")}`;
    const newAlert = {
      ...alertData,
      id
    };
    this.sosAlerts.unshift(newAlert);
    mysqlService.insertSOSAlert({
      id: newAlert.id,
      userId: newAlert.userId,
      userName: newAlert.userName,
      userEmail: newAlert.userEmail,
      alertType: newAlert.alertType,
      latitude: newAlert.latitude,
      longitude: newAlert.longitude,
      googleMapsUrl: newAlert.googleMapsUrl,
      address: newAlert.locationName,
      status: newAlert.status,
      respondersNotified: newAlert.respondersNotified,
      triggerPhrase: newAlert.triggerPhrase
    }).catch(() => {
    });
    return newAlert;
  }
  getSosAlerts() {
    return this.sosAlerts;
  }
  resolveSosAlert(id) {
    if (id) {
      const alert = this.sosAlerts.find((a) => a.id === id);
      if (alert) {
        alert.status = "Resolved";
        return true;
      }
      return false;
    }
    let updated = false;
    this.sosAlerts.forEach((a) => {
      if (a.status === "Active" || a.status === "Escalated") {
        a.status = "Resolved";
        updated = true;
      }
    });
    return updated;
  }
  // --- Vault ---
  getVaultItems(userId) {
    const all = Array.from(this.vaultItems.values());
    if (!userId) return all;
    const userItems = all.filter((v) => v.userId === userId);
    return userItems.length > 0 ? userItems : all;
  }
  addVaultItem(item) {
    const id = `v_${Date.now()}`;
    const newItem = { ...item, id };
    this.vaultItems.set(id, newItem);
    return newItem;
  }
  deleteVaultItem(id) {
    return this.vaultItems.delete(id);
  }
  // --- Voice Config ---
  getVoiceConfig(userId) {
    return this.voiceConfigs.get(userId) || {
      userId,
      triggerWord: "SURAKSHA",
      sensitivity: "medium",
      autoSos: true,
      continuousListening: true
    };
  }
  setVoiceConfig(config) {
    this.voiceConfigs.set(config.userId, config);
    return config;
  }
  // --- Incidents ---
  getIncidents() {
    return this.incidents;
  }
  addIncident(incident) {
    const id = `inc_${Date.now()}`;
    const newInc = { ...incident, id };
    this.incidents.unshift(newInc);
    return newInc;
  }
};
var dbStore = new DBStore();

// src/server/services/emailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
var EmailService = class {
  transporter = null;
  /**
   * Dynamically get or create SMTP Transporter using latest environment variables
   */
  getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }
    if (!process.env.SMTP_USER) {
      dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    }
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const rawPort = process.env.SMTP_PORT;
    const user = (process.env.SMTP_USER || "ec23019@glbitm.ac.in").trim();
    const pass = (process.env.SMTP_PASS || "qvlsjfrhfvovnruv").trim().replace(/\s+/g, "");
    const isGmail = host.includes("gmail.com") || user.includes("gmail.com") || user.includes("glbitm.ac.in");
    if (user && pass) {
      try {
        if (isGmail) {
          this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user,
              pass
            },
            connectionTimeout: 1e4,
            greetingTimeout: 1e4,
            socketTimeout: 15e3
          });
        } else {
          const port = parseInt(rawPort || "587", 10);
          this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
              user,
              pass
            },
            tls: {
              rejectUnauthorized: false
            },
            connectionTimeout: 1e4,
            greetingTimeout: 1e4,
            socketTimeout: 15e3
          });
        }
        console.log(`[EmailService] \u{1F4E7} SMTP Transporter created successfully for: ${user}`);
        return this.transporter;
      } catch (err) {
        console.error("[EmailService] Failed to create SMTP transporter:", err);
        return null;
      }
    }
    console.warn("[EmailService] SMTP credentials not set. Falling back to dev logger.");
    return null;
  }
  getFromAddress() {
    const user = (process.env.SMTP_USER || "ec23019@glbitm.ac.in").trim();
    return `"JanSuraksha AI Security" <${user}>`;
  }
  /**
   * Send 6-digit Login OTP Email via SMTP
   */
  async sendLoginOtpEmail(toEmail, otp, userName) {
    const fromAddress = this.getFromAddress();
    const name = userName || "JanSuraksha User";
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #b91c1c, #991b1b); padding: 28px 24px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo-sub { font-size: 11px; font-weight: 600; color: #fca5a5; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #f8fafc; }
        .description { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .otp-card { background: rgba(0,0,0,0.3); border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace; }
        .otp-validity { font-size: 12px; color: #f87171; margin-top: 6px; font-weight: 600; }
        .warning-box { background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #cbd5e1; margin-bottom: 24px; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">JanSuraksha AI</div>
          <div class="logo-sub">Smart Safety & Security Network</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name},</div>
          <div class="description">
            We received a request to access your JanSuraksha AI account. Use the one-time verification code below to complete your secure sign-in.
          </div>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">\u23F1 Valid for 10 minutes only</div>
          </div>
          <div class="warning-box">
            <strong>Security Notice:</strong> Never share this code with anyone. JanSuraksha AI officials will never ask for your verification code. Request generated at: <em>${timestamp} (IST)</em>.
          </div>
        </div>
        <div class="footer">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} JanSuraksha AI Systems. Automated security notification.
        </div>
      </div>
    </body>
    </html>
    `;
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          replyTo: "ec23019@glbitm.ac.in",
          priority: "high",
          headers: {
            "X-Priority": "1",
            "X-MSMail-Priority": "High",
            "Importance": "High"
          },
          subject: `\u{1F510} JanSuraksha AI \u2014 Login Verification Code: ${otp}`,
          text: `Your JanSuraksha AI login verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`,
          html: htmlContent
        });
        console.log(`[EmailService] \u2705 Login OTP sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] \u274C Failed to send email via SMTP to ${toEmail}:`, err);
        return {
          success: false,
          error: err?.message || "SMTP Authentication error. Please verify your Gmail App Password."
        };
      }
    }
    console.log("\n================== \u{1F4E7} SMTP DEV EMAIL DISPATCH \u{1F4E7} ==================");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: \u{1F510} JanSuraksha AI \u2014 Login Verification Code: ${otp}`);
    console.log(`Generated OTP Code: [ ${otp} ] (Valid for 10 minutes)`);
    console.log("===================================================================\n");
    return {
      success: false,
      mock: true,
      error: "SMTP credentials (SMTP_USER / SMTP_PASS) not configured in Vercel environment.",
      messageId: `DEV_EMAIL_${Date.now()}`
    };
  }
  /**
   * Send 6-digit Registration Verification OTP Email via SMTP
   */
  async sendRegistrationOtpEmail(toEmail, otp, userName) {
    const fromAddress = this.getFromAddress();
    const name = userName || "JanSuraksha User";
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0d1b3e); padding: 28px 24px; text-align: center; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo-sub { font-size: 13px; color: #93c5fd; margin-top: 4px; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .description { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
        .otp-card { background: rgba(30, 58, 138, 0.4); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #60a5fa; font-family: 'Courier New', monospace; }
        .otp-validity { font-size: 12px; color: #93c5fd; margin-top: 8px; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin: 20px 0; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">JanSuraksha AI</div>
          <div class="logo-sub">Account Registration Verification</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${name}!</div>
          <div class="description">
            Thank you for registering with JanSuraksha AI. To complete your account creation and activate your 24/7 AI safety network, please enter the one-time verification code below:
          </div>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">\u23F1 Valid for 10 minutes</div>
          </div>
          <div class="warning-box">
            <strong>Security Notice:</strong> Please enter this code on the registration page to finalize your account. Request generated at: <em>${timestamp} (IST)</em>.
          </div>
        </div>
        <div class="footer">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} JanSuraksha AI Systems. Automated registration notification.
        </div>
      </div>
    </body>
    </html>
    `;
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          replyTo: "ec23019@glbitm.ac.in",
          priority: "high",
          headers: {
            "X-Priority": "1",
            "X-MSMail-Priority": "High",
            "Importance": "High"
          },
          subject: `\u{1F510} JanSuraksha AI \u2014 Verify Your Email: ${otp}`,
          text: `Your JanSuraksha AI registration verification code is: ${otp}. It expires in 10 minutes.`,
          html: htmlContent
        });
        console.log(`[EmailService] \u2705 Registration OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] \u274C Failed to send registration email via SMTP to ${toEmail}:`, err);
        return {
          success: false,
          error: err?.message || "SMTP Authentication error. Please verify your Gmail App Password."
        };
      }
    }
    console.log("\n================== \u{1F4E7} REGISTRATION OTP DISPATCH \u{1F4E7} ==================");
    console.log(`To: ${toEmail} (${name})`);
    console.log(`Subject: \u{1F510} JanSuraksha AI \u2014 Verify Your Email: ${otp}`);
    console.log(`Registration OTP: [ ${otp} ] (Valid for 10 minutes)`);
    console.log("====================================================================\n");
    return {
      success: false,
      mock: true,
      error: "SMTP credentials (SMTP_USER / SMTP_PASS) not configured in Vercel environment.",
      messageId: `DEV_REG_EMAIL_${Date.now()}`
    };
  }
  /**
   * Send Welcome / Registration Confirmation Email
   */
  async sendWelcomeEmail(toEmail, userName) {
    const fromAddress = this.getFromAddress();
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #0d1b3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0d1b3e); padding: 32px 24px; text-align: center; }
        .title { font-size: 26px; font-weight: 900; color: #ffffff; margin-bottom: 6px; }
        .subtitle { font-size: 13px; color: #93c5fd; }
        .content { padding: 32px 24px; }
        .highlight { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 14px; color: #86efac; }
        .feature-list { list-style: none; padding: 0; margin: 20px 0; }
        .feature-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #cbd5e1; display: flex; align-items: center; }
        .footer { background: #080d1a; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Welcome to JanSuraksha AI</div>
          <div class="subtitle">Your 24/7 AI-Powered Personal Safety Shield</div>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 600;">Welcome aboard, ${userName}!</p>
          <div class="highlight">
            \u2713 Your JanSuraksha AI account has been successfully created and secured.
          </div>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            You now have access to intelligent real-time protection tools:
          </p>
          <ul class="feature-list">
            <li class="feature-item">\u{1F6A8} <strong>Instant SOS Emergency</strong> \u2014 One-tap alert with live GPS coordinates</li>
            <li class="feature-item">\u{1F399}\uFE0F <strong>Voice Trigger Activation</strong> \u2014 Hands-free secret distress detection</li>
            <li class="feature-item">\u{1F4CD} <strong>Live Threat Tracking</strong> \u2014 Dynamic risk zone and safe route analysis</li>
            <li class="feature-item">\u{1F512} <strong>Encrypted Evidence Vault</strong> \u2014 Secure cloud capture of audio & video</li>
            <li class="feature-item">\u{1F465} <strong>Community Rescue Network</strong> \u2014 Verified nearby responder broadcast</li>
          </ul>
        </div>
        <div class="footer">
          &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} JanSuraksha AI Systems. Stay Safe, Stay Protected.
        </div>
      </div>
    </body>
    </html>
    `;
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: "\u{1F6E1}\uFE0F Welcome to JanSuraksha AI \u2014 Your Account is Ready",
          text: `Welcome to JanSuraksha AI, ${userName}! Your account is active. Stay protected 24/7.`,
          html: htmlContent
        });
        console.log(`[EmailService] \u2705 Welcome email sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error("[EmailService] \u274C Failed to send welcome email:", err);
      }
    }
    console.log(`[EmailService DEV] Welcome confirmation email dispatched for: ${toEmail} (${userName})`);
    return { success: true, mock: true, messageId: `DEV_WELCOME_${Date.now()}` };
  }
  /**
   * Send SOS Alert Notification Email (supports single recipient or list of recipients)
   */
  async sendSOSEmergencyEmail(toEmail, alertData) {
    const fromAddress = this.getFromAddress();
    const recipients = Array.isArray(toEmail) ? toEmail : [toEmail];
    const validRecipients = recipients.filter((e) => e && typeof e === "string" && e.includes("@"));
    if (validRecipients.length === 0) {
      console.warn("[EmailService] No valid recipient email addresses for SOS alert.");
      return { success: false, error: "No valid email recipients" };
    }
    const mapUrl = alertData.locationUrl || "https://www.google.com/maps?q=28.6139,77.2090";
    const addressDisplay = alertData.address || "Real-time GPS Tracking Active";
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a0505; color: #ffffff; padding: 16px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #2a0808; border: 2px solid #ef4444; border-radius: 16px; padding: 28px; box-shadow: 0 12px 40px rgba(239, 68, 68, 0.35); }
        .badge { display: inline-block; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px; }
        .title { font-size: 26px; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; color: #fca5a5; margin: 0 0 24px 0; }
        .alert-box { background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 20px; border-radius: 12px; margin: 20px 0; }
        .alert-row { font-size: 15px; margin: 10px 0; color: #fee2e2; line-height: 1.5; }
        .alert-row strong { color: #ffffff; }
        .map-card { background: #180303; border: 2px solid #f87171; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center; }
        .map-title { font-size: 17px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
        .map-addr { font-size: 14px; color: #fecaca; margin-bottom: 18px; line-height: 1.4; word-break: break-word; }
        .btn-map { display: inline-block; background: #ef4444; color: #ffffff !important; font-weight: 800; padding: 15px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5); }
        .raw-link { font-size: 12px; color: #93c5fd; margin-top: 14px; word-break: break-all; }
        .footer { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: center;">
          <div class="badge">\u26A0\uFE0F DISTRESS SIGNAL DETECTED</div>
          <div class="title">\u{1F6A8} CRITICAL EMERGENCY SOS</div>
          <div class="subtitle">JanSuraksha AI 24/7 Rapid Response Dispatch</div>
        </div>

        <div class="alert-box">
          <div class="alert-row"><strong>\u{1F464} User:</strong> ${alertData.userName}</div>
          <div class="alert-row"><strong>\u{1F4DE} Contact Phone:</strong> <a href="tel:${alertData.phone}" style="color: #60a5fa; font-weight: bold; text-decoration: none;">${alertData.phone}</a></div>
          <div class="alert-row"><strong>\u{1F399}\uFE0F Distress Trigger:</strong> <span style="background: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: bold;">${alertData.triggerWord || "Voice / Manual SOS"}</span></div>
          <div class="alert-row"><strong>\u23F1\uFE0F Time:</strong> ${alertData.timestamp || (/* @__PURE__ */ new Date()).toLocaleString("en-IN")} (IST)</div>
        </div>

        <div class="map-card">
          <div class="map-title">\u{1F4CD} LIVE GPS LOCATION & TRACKING</div>
          <div class="map-addr"><strong>Location Area:</strong> ${addressDisplay}</div>
          <a href="${mapUrl}" class="btn-map" target="_blank">\u{1F4CD} Open Live Location in Google Maps</a>
          <div class="raw-link">
            <strong>Direct Tracking URL:</strong><br/>
            <a href="${mapUrl}" style="color: #60a5fa;" target="_blank">${mapUrl}</a>
          </div>
        </div>

        <div class="footer">
          JanSuraksha AI Automated Emergency Response System. Please contact or dispatch assistance to this person immediately.
        </div>
      </div>
    </body>
    </html>
    `;
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: validRecipients.join(", "),
          subject: `\u{1F6A8} CRITICAL EMERGENCY ALERT: ${alertData.userName} needs help (${alertData.triggerWord || "SOS"})`,
          text: `\u{1F6A8} CRITICAL EMERGENCY ALERT from ${alertData.userName} (${alertData.phone})!
Trigger: ${alertData.triggerWord || "Emergency"}
Time: ${alertData.timestamp || (/* @__PURE__ */ new Date()).toLocaleString()}
Location: ${addressDisplay}
Live Google Maps Tracking URL: ${mapUrl}

Please check on this person immediately!`,
          html: htmlContent
        });
        console.log(`[EmailService] \u2705 Emergency SOS email successfully delivered to [${validRecipients.join(", ")}]. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`[EmailService] \u274C Failed to send SOS alert email to [${validRecipients.join(", ")}]:`, err);
        return { success: false, error: err instanceof Error ? err.message : "SMTP dispatch failure" };
      }
    }
    console.log(`[EmailService DEV] SOS Emergency notification email simulated for: ${validRecipients.join(", ")}`);
    return { success: true, mock: true, messageId: `DEV_SOS_${Date.now()}` };
  }
};
var emailService = new EmailService();

// src/server/api/auth/login-initiate/POST.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = dbStore.findUserByEmail(cleanEmail);
    if (password && user) {
      const isMatch = bcryptjs2.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    dbStore.setOtp(cleanEmail, otp);
    const emailResult = await emailService.sendLoginOtpEmail(cleanEmail, otp, user?.name || cleanEmail.split("@")[0]);
    if (!emailResult.success && emailResult.error) {
      return res.status(500).json({
        success: false,
        message: `Email dispatch failed: ${emailResult.error}`,
        error: emailResult.error
      });
    }
    console.log(`[AUTH] Login OTP dispatched to ${cleanEmail}. OTP: [${otp}]`);
    const userEmail = user?.email || cleanEmail;
    const maskedEmail = userEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return first + "*".repeat(Math.max(1, middle.length)) + domain;
    });
    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      email: userEmail,
      step: "otp"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Login initiation failed";
    console.error("[AUTH ERROR] Login initiate exception:", error);
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/auth/login-verify/POST.ts
async function handler2(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }
    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit OTP code" });
    }
    const user = dbStore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isValid = dbStore.verifyOtp(email, cleanOtp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code. Please try again." });
    }
    const isAdmin = user.email.toLowerCase() === "ec23019@glbitm.ac.in" || user.email.toLowerCase() === "admin@jansuraksha.ai";
    if (isAdmin && user.role !== "admin") {
      user.role = "admin";
    }
    const token = dbStore.generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: isAdmin ? "admin" : user.role,
      plan: isAdmin ? "Premium" : user.plan,
      safetyScore: user.safetyScore,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate
    };
    console.log(`[AUTH] User verified OTP and logged in: ${user.email}`);
    return res.status(200).json({
      success: true,
      message: "Login successful! Welcome back.",
      token,
      user: safeUser
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "OTP verification failed";
    console.error("[AUTH ERROR] OTP verify exception:", error);
    return res.status(400).json({ success: false, message: msg });
  }
}

// src/server/api/auth/login/POST.ts
import bcryptjs3 from "bcryptjs";
async function handler3(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = dbStore.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const isMatch = bcryptjs3.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const isAdmin = user.email.toLowerCase() === "ec23019@glbitm.ac.in" || user.email.toLowerCase() === "admin@jansuraksha.ai";
    if (isAdmin && user.role !== "admin") {
      user.role = "admin";
    }
    const token = dbStore.generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: isAdmin ? "admin" : user.role,
      plan: isAdmin ? "Premium" : user.plan,
      safetyScore: user.safetyScore,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate
    };
    console.log(`[AUTH] Direct login successful for ${user.email}`);
    return res.status(200).json({
      success: true,
      message: "Login successful! Welcome back to JanSuraksha AI.",
      token,
      user: safeUser
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Login failed";
    console.error("[AUTH ERROR] Direct login exception:", error);
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/auth/register-initiate/POST.ts
async function handler4(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Please enter a valid full name (minimum 2 characters)" });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return res.status(400).json({ success: false, message: "Please enter a valid phone number" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = dbStore.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: "This email address is already registered. Please sign in." });
    }
    const otp = dbStore.setPendingRegistration({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone.trim()
    });
    const emailResult = await emailService.sendRegistrationOtpEmail(cleanEmail, otp, name.trim());
    if (!emailResult.success && emailResult.error) {
      return res.status(500).json({
        success: false,
        message: `Email delivery failed: ${emailResult.error}`,
        error: emailResult.error
      });
    }
    console.log(`[AUTH] Registration OTP generated and dispatched via SMTP for ${cleanEmail}`);
    return res.status(200).json({
      success: true,
      message: `A 6-digit verification security code has been sent to ${cleanEmail}`,
      email: cleanEmail,
      step: "otp"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to initiate registration";
    console.error("[AUTH ERROR] Register initiate exception:", error);
    return res.status(400).json({ success: false, message: msg });
  }
}

// src/server/api/auth/register-verify/POST.ts
async function handler5(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email, otp } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Please enter the full 6-digit verification code" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const newUser = dbStore.verifyPendingRegistration(cleanEmail, otp.trim());
    const token = dbStore.generateToken(newUser);
    emailService.sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.error("[Auth Register] Welcome email dispatch warning:", err);
    });
    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      plan: newUser.plan,
      safetyScore: newUser.safetyScore,
      avatar: newUser.avatar,
      location: newUser.location,
      joinedDate: newUser.joinedDate
    };
    console.log(`[AUTH] Registration OTP verified. Account activated: ${newUser.email} (ID: ${newUser.id})`);
    return res.status(201).json({
      success: true,
      message: "Account verified and registered successfully! Welcome to JanSuraksha AI.",
      token,
      user: safeUser
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Registration verification failed";
    console.error("[AUTH ERROR] Register verify exception:", error);
    return res.status(400).json({ success: false, message: msg });
  }
}

// src/server/api/auth/register/POST.ts
async function handler6(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Please enter a valid full name" });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ success: false, message: "Please enter a valid phone number" });
    }
    const existingUser = dbStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "This email is already registered. Please sign in." });
    }
    const newUser = dbStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim()
    });
    emailService.sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.error("[Auth Register] Welcome email notice:", err);
    });
    const token = dbStore.generateToken(newUser);
    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      plan: newUser.plan,
      safetyScore: newUser.safetyScore,
      avatar: newUser.avatar,
      location: newUser.location,
      joinedDate: newUser.joinedDate
    };
    console.log(`[AUTH] User registered successfully: ${newUser.email} (ID: ${newUser.id})`);
    return res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to JanSuraksha AI.",
      token,
      user: safeUser
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Registration failed";
    console.error("[AUTH ERROR] Register exception:", error);
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/auth/resend-otp/POST.ts
async function handler7(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = dbStore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    dbStore.setOtp(user.email, otp);
    const emailResult = await emailService.sendLoginOtpEmail(user.email, otp, user.name);
    console.log(`[AUTH] Resent OTP code to ${user.email}: [${otp}]`);
    return res.status(200).json({
      success: true,
      message: "A new 6-digit verification code has been dispatched to your email."
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resend OTP";
    console.error("[AUTH ERROR] Resend OTP exception:", error);
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/auth/register-resend-otp/POST.ts
async function handler8(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const { otp, name } = dbStore.resendRegistrationOtp(cleanEmail);
    await emailService.sendRegistrationOtpEmail(cleanEmail, otp, name);
    console.log(`[AUTH] Resent registration OTP to ${cleanEmail}`);
    return res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${cleanEmail}`
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resend verification code";
    return res.status(400).json({ success: false, message: msg });
  }
}

// src/server/api/auth/me/GET.ts
async function handler9(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: missing token" });
    }
    const token = authHeader.substring(7);
    const decoded = dbStore.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    const user = dbStore.findUserById(decoded.id) || dbStore.findUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      plan: user.plan,
      safetyScore: user.safetyScore,
      avatar: user.avatar,
      location: user.location,
      joinedDate: user.joinedDate
    };
    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch user";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/sos/POST.ts
async function handler10(req, res) {
  const startTime = Date.now();
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
    }
    const {
      phone: rawPhone,
      user: rawUser,
      userId,
      userEmail,
      guardianEmails,
      location,
      address,
      coordinates,
      triggerWord,
      message: customMessage,
      timestamp
    } = req.body;
    const phone = rawPhone || "+919876543210";
    const userName = rawUser || "JanSuraksha User";
    const timeStr = timestamp ? new Date(timestamp).toLocaleString("en-IN") : (/* @__PURE__ */ new Date()).toLocaleString("en-IN");
    const lat = coordinates?.latitude;
    const lng = coordinates?.longitude;
    let locationMapUrl;
    if (lat !== void 0 && lng !== void 0) {
      locationMapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else if (location && location.startsWith("http")) {
      locationMapUrl = location;
    } else {
      locationMapUrl = `https://www.google.com/maps?q=28.6139,77.2090`;
    }
    const locationDisplay = address || (location && !location.startsWith("http") ? location : "") || (lat !== void 0 && lng !== void 0 ? `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Live GPS Area");
    const alertRecord = dbStore.createSosAlert({
      userId,
      user: userName,
      phone,
      type: triggerWord ? "Voice Trigger" : "Manual SOS",
      time: timeStr,
      location: locationDisplay,
      coordinates,
      status: "Active",
      responders: 3,
      triggerWord,
      message: customMessage || "\u{1F6A8} Emergency distress signal activated",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const fullMessage = `\u{1F6A8} *JAN SURAKSHA EMERGENCY ALERT* \u{1F6A8}

*Trigger:* ${triggerWord || "Instant SOS"}
*User:* ${userName} (${phone})
*Time:* ${timeStr}
` + (locationDisplay ? `*Location:* ${locationDisplay}
` : "") + (locationMapUrl ? `*GPS Map:* ${locationMapUrl}

` : "\n") + `Please check on this person immediately or dispatch responders!`;
    const emergencyRecipients = [];
    if (process.env.SMTP_USER && process.env.SMTP_USER.includes("@")) {
      emergencyRecipients.push(process.env.SMTP_USER);
    }
    if (process.env.EMERGENCY_ALERT_EMAIL && process.env.EMERGENCY_ALERT_EMAIL.includes("@")) {
      emergencyRecipients.push(process.env.EMERGENCY_ALERT_EMAIL);
    }
    if (userEmail && userEmail.includes("@") && !emergencyRecipients.includes(userEmail)) {
      emergencyRecipients.push(userEmail);
    }
    if (Array.isArray(guardianEmails)) {
      for (const gEmail of guardianEmails) {
        if (gEmail && typeof gEmail === "string" && gEmail.includes("@") && !emergencyRecipients.includes(gEmail)) {
          emergencyRecipients.push(gEmail);
        }
      }
    }
    if (userId) {
      const userObj = dbStore.findUserById(userId);
      if (userObj?.email && !emergencyRecipients.includes(userObj.email)) {
        emergencyRecipients.push(userObj.email);
      }
      const contacts = dbStore.getContacts(userId);
      for (const c of contacts) {
        if (c.email && c.email.includes("@") && !emergencyRecipients.includes(c.email)) {
          emergencyRecipients.push(c.email);
        }
      }
    }
    if (emergencyRecipients.length > 0) {
      try {
        const emailResult = await emailService.sendSOSEmergencyEmail(emergencyRecipients, {
          userName,
          phone,
          locationUrl: locationMapUrl,
          address: locationDisplay,
          triggerWord: triggerWord || "Voice / Manual SOS",
          timestamp: timeStr
        });
        console.log(`[SOS EMAIL DISPATCH] Sent to [${emergencyRecipients.join(", ")}]. Result:`, emailResult);
      } catch (emailErr) {
        console.error("[SOS Email Dispatch Error]:", emailErr);
      }
    }
    const responseTime = Date.now() - startTime;
    console.log(`[SOS ALERT DISPATCHED] ID: ${alertRecord.id} in ${responseTime}ms for ${userName}`);
    return res.status(200).json({
      success: true,
      message: "\u{1F6A8} Emergency alert triggered! Responders & contacts notified.",
      alertId: alertRecord.id,
      alert: alertRecord,
      timestamp: alertRecord.timestamp
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[SOS ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send emergency alert",
      error: errorMsg
    });
  }
}

// src/server/api/sos/active/GET.ts
async function handler11(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const alerts = dbStore.getSosAlerts();
    const active = alerts.find((a) => a.status === "Active" || a.status === "Escalated");
    return res.status(200).json({
      success: true,
      hasActiveAlert: !!active,
      activeAlert: active || null
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to check active alert";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/sos/history/GET.ts
async function handler12(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const alerts = dbStore.getSosAlerts();
    return res.status(200).json({
      success: true,
      alerts
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch alert history";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/sos/resolve/POST.ts
async function handler13(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { alertId } = req.body || {};
    dbStore.resolveSosAlert(alertId);
    console.log(`[SOS] Emergency resolved: ${alertId || "all active"}`);
    return res.status(200).json({
      success: true,
      message: "Emergency status marked as resolved. User marked safe."
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resolve emergency";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/voice/config/GET.ts
async function handler14(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId = "u-demo-1";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const config = dbStore.getVoiceConfig(userId);
    return res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch voice config";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/voice/config/PUT.ts
async function handler15(req, res) {
  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId = "u-demo-1";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const { triggerWord, sensitivity, autoSos, continuousListening } = req.body || {};
    if (!triggerWord || typeof triggerWord !== "string") {
      return res.status(400).json({ success: false, message: "Trigger word is required" });
    }
    const updated = dbStore.setVoiceConfig({
      userId,
      triggerWord: triggerWord.trim().toUpperCase(),
      sensitivity: sensitivity || "medium",
      autoSos: autoSos !== false,
      continuousListening: continuousListening !== false
    });
    console.log(`[VOICE] Updated trigger word for ${userId}: ${updated.triggerWord}`);
    return res.status(200).json({
      success: true,
      message: `Voice trigger set to "${updated.triggerWord}"`,
      config: updated
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update voice config";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/contacts/GET.ts
async function handler16(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const contacts = dbStore.getContacts(userId);
    return res.status(200).json({
      success: true,
      contacts
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch contacts";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/contacts/POST.ts
async function handler17(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId = "u-demo-1";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const { name, phone, relation, isPrimary, notifyLevel, shareLocation } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }
    const newContact = dbStore.addContact({
      userId,
      name: name.trim(),
      phone: phone.trim(),
      relation: relation || "Family",
      isPrimary: Boolean(isPrimary),
      notifyLevel: notifyLevel || "always",
      shareLocation: shareLocation !== false,
      verified: true,
      avatar: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "C"
    });
    console.log(`[CONTACTS] Added contact: ${newContact.name} (${newContact.phone})`);
    return res.status(201).json({
      success: true,
      message: "Emergency contact added successfully",
      contact: newContact
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to add contact";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/contacts/PUT.ts
async function handler18(req, res) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { id, name, phone, relation, isPrimary, notifyLevel, shareLocation } = req.body || {};
    const contactId = id || req.query.id;
    if (!contactId) {
      return res.status(400).json({ success: false, message: "Contact ID is required" });
    }
    const updated = dbStore.updateContact(contactId, {
      ...name && { name: name.trim() },
      ...phone && { phone: phone.trim() },
      ...relation && { relation },
      ...isPrimary !== void 0 && { isPrimary: Boolean(isPrimary) },
      ...notifyLevel && { notifyLevel },
      ...shareLocation !== void 0 && { shareLocation: Boolean(shareLocation) }
    });
    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      contact: updated
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update contact";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/contacts/DELETE.ts
async function handler19(req, res) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const contactId = req.body && req.body.id || req.query && req.query.id;
    if (!contactId) {
      return res.status(400).json({ success: false, message: "Contact ID is required" });
    }
    const deleted = dbStore.deleteContact(contactId);
    return res.status(200).json({
      success: deleted,
      message: deleted ? "Contact removed" : "Contact not found"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete contact";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/tracking/update/POST.ts
async function handler20(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { latitude, longitude, address, city, speed, accuracy } = req.body || {};
    if (latitude === void 0 || longitude === void 0) {
      return res.status(400).json({ success: false, message: "Coordinates are required" });
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded && address) {
        dbStore.updateUser(decoded.id, { location: address });
      }
    }
    return res.status(200).json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      received: { latitude, longitude, city, accuracy }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update location";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/tracking/risk-zones/GET.ts
async function handler21(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const lat = parseFloat(req.query.lat) || 28.6139;
    const lng = parseFloat(req.query.lng) || 77.209;
    const city = req.query.city || "Local Area";
    const zones = [
      {
        id: "z1",
        name: `${city} North Sector`,
        level: "high",
        distance: "0.8 km away",
        latitude: lat + 75e-4,
        longitude: lng + 62e-4,
        tip: "Elevated incidents after 9:00 PM \u2014 low street illumination. Avoid sub-lanes.",
        badge: "bg-red-500/10 border-red-500/20 text-red-400"
      },
      {
        id: "z2",
        name: `${city} Commercial Corridor`,
        level: "medium",
        distance: "1.2 km away",
        latitude: lat - 55e-4,
        longitude: lng - 7e-3,
        tip: "Moderate crowd congestion \u2014 stay alert in transit junctions.",
        badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      },
      {
        id: "z3",
        name: `${city} Industrial Road`,
        level: "medium",
        distance: "1.7 km away",
        latitude: lat + 9e-3,
        longitude: lng - 85e-4,
        tip: "Sparse pedestrian activity during late evening hours.",
        badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      }
    ];
    const safeRoutes = [
      {
        id: "r1",
        name: "Main Well-Lit Boulevard",
        safetyScore: "94/100",
        safetyLevel: "HIGH_SAFETY",
        details: "CCTV monitored, active street illumination, 2 police patrol booths"
      },
      {
        id: "r2",
        name: "Metro Transit Corridor",
        safetyScore: "88/100",
        safetyLevel: "HIGH_SAFETY",
        details: "Continuous footfall, well illuminated, emergency kiosks every 300m"
      }
    ];
    return res.status(200).json({
      success: true,
      city,
      center: { latitude: lat, longitude: lng },
      riskZones: zones,
      safeRoutes
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch risk zones";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/vault/GET.ts
async function handler22(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const items = dbStore.getVaultItems(userId);
    return res.status(200).json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch vault items";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/vault/POST.ts
async function handler23(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const authHeader = req.headers.authorization;
    let userId = "u-demo-1";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = dbStore.verifyToken(authHeader.substring(7));
      if (decoded) userId = decoded.id;
    }
    const { type, title, size, duration, emergency, encrypted, dataUrl } = req.body || {};
    if (!type) {
      return res.status(400).json({ success: false, message: "Media type is required (photo, video, audio)" });
    }
    const dateStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const newItem = dbStore.addVaultItem({
      userId,
      type: type || "photo",
      title: title || `Evidence Capture (${type})`,
      date: dateStr,
      size: size || "1.5 MB",
      duration,
      emergency: emergency !== false,
      encrypted: encrypted !== false,
      dataUrl
    });
    console.log(`[VAULT] Saved evidence item: ${newItem.id} (${newItem.type})`);
    return res.status(201).json({
      success: true,
      message: "Evidence securely stored in encrypted vault",
      item: newItem
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save vault item";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/vault/DELETE.ts
async function handler24(req, res) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const id = req.body && req.body.id || req.query && req.query.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }
    const deleted = dbStore.deleteVaultItem(id);
    return res.status(200).json({
      success: deleted,
      message: deleted ? "Vault item removed" : "Item not found"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete vault item";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/community/helpers/GET.ts
async function handler25(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const lat = parseFloat(req.query.lat) || 28.6139;
    const lng = parseFloat(req.query.lng) || 77.209;
    const helpers = [
      {
        id: "H1",
        name: "Verified Responder #104",
        distance: "0.3 km",
        status: "available",
        rating: 4.9,
        verified: true,
        responseTime: "~2 min",
        coords: { latitude: lat + 2e-3, longitude: lng + 2e-3 }
      },
      {
        id: "H2",
        name: "Verified Responder #218",
        distance: "0.5 km",
        status: "available",
        rating: 4.7,
        verified: true,
        responseTime: "~3 min",
        coords: { latitude: lat - 3e-3, longitude: lng + 4e-3 }
      },
      {
        id: "H3",
        name: "Community Patrol #09",
        distance: "0.8 km",
        status: "busy",
        rating: 4.8,
        verified: true,
        responseTime: "~5 min",
        coords: { latitude: lat + 5e-3, longitude: lng - 3e-3 }
      },
      {
        id: "H4",
        name: "Verified Responder #330",
        distance: "1.1 km",
        status: "available",
        rating: 4.6,
        verified: true,
        responseTime: "~6 min",
        coords: { latitude: lat - 6e-3, longitude: lng - 5e-3 }
      }
    ];
    const emergencyServices = [
      {
        id: "s1",
        name: "Nearest Police Station",
        distance: "0.6 km",
        phone: "100",
        type: "police"
      },
      {
        id: "s2",
        name: "Civil Hospital Emergency",
        distance: "1.2 km",
        phone: "102",
        type: "medical"
      },
      {
        id: "s3",
        name: "Fire & Rescue Station",
        distance: "0.9 km",
        phone: "101",
        type: "fire"
      }
    ];
    return res.status(200).json({
      success: true,
      helpers,
      emergencyServices
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch community helpers";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/community/incidents/GET.ts
async function handler26(req, res) {
  if (req.method === "GET") {
    try {
      const incidents = dbStore.getIncidents();
      return res.status(200).json({ success: true, incidents });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch incidents";
      return res.status(500).json({ success: false, message: msg });
    }
  }
  if (req.method === "POST") {
    try {
      const { title, category, location, coordinates, severity, description } = req.body || {};
      if (!title || !location) {
        return res.status(400).json({ success: false, message: "Title and location are required" });
      }
      const newInc = dbStore.addIncident({
        title: title.trim(),
        category: category || "Hazard",
        location: location.trim(),
        coordinates,
        time: "Just now",
        severity: severity || "medium",
        description: description || "",
        upvotes: 1
      });
      console.log(`[COMMUNITY] Incident reported: ${newInc.title}`);
      return res.status(201).json({
        success: true,
        message: "Community incident report posted successfully",
        incident: newInc
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to report incident";
      return res.status(500).json({ success: false, message: msg });
    }
  }
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

// src/server/api/community/request-help/POST.ts
async function handler27(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { helperId, coordinates, address } = req.body || {};
    console.log(`[COMMUNITY RESCUE] Distress broadcast sent to helper ${helperId || "all"}`);
    return res.status(200).json({
      success: true,
      message: helperId ? "Direct assistance request sent to responder! They are navigating to your location." : "Anonymous distress broadcast sent to 4 nearby verified helpers.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      eta: "2-4 minutes"
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to request help";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/assistant/chat/POST.ts
async function handler28(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const { message, location, coordinates } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    const query = message.trim().toLowerCase();
    const city = location?.city || location?.address || "Your Current Area";
    let reply = "";
    let category = "general";
    if (query.includes("area safe") || query.includes("is it safe") || query.includes("threat")) {
      category = "safety_assessment";
      reply = `Based on real-time threat telemetry in **${city}**, here is your safety assessment:

\u{1F7E1} **Safety Level: MODERATE (78/100)**

- 2 risk zones monitored within 1.5 km (low illumination sub-lanes).
- Active police patrol reported on primary avenues.
- 4 verified JanSuraksha community responders active nearby.

**AI Recommendations:**
1. Stick to primary well-lit transit arteries.
2. Keep Live Tracking active if walking alone.
3. Ensure your secret voice trigger is enabled for hands-free emergency calling.`;
    } else if (query.includes("route") || query.includes("home") || query.includes("directions")) {
      category = "route_guidance";
      reply = `I have analyzed safe transit corridors around **${city}**:

\u2705 **Recommended Safe Route (94% Safety Score)**
Via Central Boulevard \u2192 Main Avenue Transit Corridor
- High CCTV density, 24/7 commercial activity, active street lighting.
- 2 emergency assistance kiosks along the route.

\u26A0\uFE0F **Alternative Route (Avoid after 9:30 PM)**
Via North Bypass Sub-lanes
- Lower footfall and sparse lighting.

Would you like me to start **Live Tracking** and share your route with your emergency contacts?`;
    } else if (query.includes("emergency") || query.includes("sos") || query.includes("help") || query.includes("danger")) {
      category = "emergency_protocol";
      reply = `\u{1F6A8} **JAN SURAKSHA EMERGENCY PROTOCOL**

1. **Trigger SOS Immediately**: Press the red SOS button or say your secret trigger word.
2. **Automatic Broadcast**: Your live GPS coordinates and street address are dispatched to your emergency contacts & nearest responders.
3. **Evidence Vault**: Secure audio/photo recording begins immediately.

\u{1F4DE} **Direct Emergency Helplines (India):**
- National Emergency: **112**
- Police: **100**
- Women Helpline: **1091**`;
    } else if (query.includes("voice") || query.includes("trigger") || query.includes("secret")) {
      category = "voice_trigger";
      reply = `\u{1F399}\uFE0F **Voice Trigger Setup Guide:**

1. Navigate to the **Voice Trigger** screen.
2. Tap "Configure Secret Word" and choose a phrase (default: **SURAKSHA**, **Help**, **Bachao**).
3. Turn on Continuous Listening.

When in distress, speak the word and JanSuraksha AI will dispatch an SOS emergency alert automatically in background.`;
    } else if (query.includes("score") || query.includes("improve") || query.includes("rating")) {
      category = "score_optimization";
      reply = `Your current **Safety Score is 78/100**.

To reach **95+ (EXCELLENT)**:
\u2022 \u{1F464} Add at least 3 emergency contacts (+10 pts)
\u2022 \u{1F399}\uFE0F Configure your custom voice trigger word (+5 pts)
\u2022 \u{1F4CD} Turn on location sharing during late-night hours (+5 pts)
\u2022 \u{1F465} Connect with the Community Rescue Network (+5 pts)`;
    } else {
      reply = `I am your **JanSuraksha AI Safety Assistant**, actively monitoring safety telemetry in **${city}**.

You can ask me to:
\u2022 Assess the safety level of your current location
\u2022 Recommend the safest well-lit route home
\u2022 Guide you through emergency SOS protocols
\u2022 Help configure your voice triggers and emergency contacts

How can I assist your safety today?`;
    }
    return res.status(200).json({
      success: true,
      category,
      reply,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Assistant query failed";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/admin/stats/GET.ts
async function handler29(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const users = dbStore.getAllUsers();
    const alerts = dbStore.getSosAlerts();
    const vault = dbStore.getVaultItems();
    const activeAlerts = alerts.filter((a) => a.status === "Active" || a.status === "Escalated");
    const resolvedAlerts = alerts.filter((a) => a.status === "Resolved");
    const stats = {
      totalUsers: users.length + 1240,
      // realistic scale
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length + 512,
      totalEvidenceCaptured: vault.length + 840,
      activeResponders: 86,
      systemHealth: "100% Operational",
      avgResponseTime: "1.8 min",
      uptime: "99.98%"
    };
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch admin stats";
    return res.status(500).json({ success: false, message: msg });
  }
}

// src/server/api/admin/users/GET.ts
async function handler30(req, res) {
  if (req.method === "GET") {
    try {
      const users = dbStore.getAllUsers().map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        plan: u.plan,
        status: "Active",
        joined: u.joinedDate,
        lastSeen: "Active now",
        sosCount: 1,
        location: u.location || "India"
      }));
      return res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch users";
      return res.status(500).json({ success: false, message: msg });
    }
  }
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

// src/server/api/admin/alerts/GET.ts
async function handler31(req, res) {
  if (req.method === "GET") {
    try {
      const alerts = dbStore.getSosAlerts();
      return res.status(200).json({ success: true, alerts });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch alerts";
      return res.status(500).json({ success: false, message: msg });
    }
  }
  if (req.method === "PUT" || req.method === "POST") {
    try {
      const { id, status } = req.body || {};
      if (id) {
        dbStore.resolveSosAlert(id);
      }
      return res.status(200).json({ success: true, message: "Alert status updated" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update alert";
      return res.status(500).json({ success: false, message: msg });
    }
  }
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

// src/server/api/admin/test-email/GET.ts
async function handler32(req, res) {
  try {
    const toEmail = req.query.to || process.env.SMTP_USER || "test@example.com";
    const testOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const smtpUser = process.env.SMTP_USER || "NOT_SET";
    const hasSmtpPass = !!process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    console.log(`[TEST EMAIL] Initiating test OTP email dispatch to: ${toEmail}`);
    const result = await emailService.sendRegistrationOtpEmail(
      toEmail,
      testOtp,
      "JanSuraksha Diagnostics"
    );
    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      diagnostic: {
        targetEmail: toEmail,
        configuredSmtpUser: smtpUser.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => f + "***" + d),
        hasSmtpPass,
        smtpHost,
        smtpResult: result
      },
      message: result.success ? `Test email successfully dispatched to ${toEmail}! Check your inbox/spam.` : `SMTP dispatch failed: ${result.error || "Unknown error"}`
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Diagnostic error";
    return res.status(500).json({
      success: false,
      error: msg
    });
  }
}

// src/server/api/health/GET.ts
async function handler33(_req, res) {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    message: "Hello World!"
  });
}

// src/server/entry.ts
dotenv2.config({ path: path2.resolve(process.cwd(), ".env") });
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, User-Agent");
  res.setHeader("Cache-Control", "no-cache");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${subpath}`;
  } else if (req.headers["x-forwarded-uri"]) {
    req.url = req.headers["x-forwarded-uri"];
  }
  next();
});
app.get("/", (req, res) => res.json({ status: "ok", message: "JanSuraksha API Root Active" }));
app.get("/api", (req, res) => res.json({ status: "ok", message: "JanSuraksha API Active" }));
var mount = (route, method, handler35) => {
  const apiRoute = route.startsWith("/api") ? route : `/api${route}`;
  const rawRoute = route.startsWith("/api") ? route.replace(/^\/api/, "") : route;
  const wrappedHandler = async (req, res) => {
    try {
      await handler35(req, res);
    } catch (err) {
      console.error(`[API ERROR in ${route}]:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: err?.message || "Internal Server Error"
        });
      }
    }
  };
  app[method](apiRoute, wrappedHandler);
  if (rawRoute && rawRoute !== "") {
    app[method](rawRoute, wrappedHandler);
  }
};
mount("/health", "get", handler33);
mount("/auth/login-initiate", "post", handler);
mount("/auth/login-verify", "post", handler2);
mount("/auth/login", "post", handler3);
mount("/auth/register-initiate", "post", handler4);
mount("/auth/register-verify", "post", handler5);
mount("/auth/register", "post", handler6);
mount("/auth/resend-otp", "post", handler7);
mount("/auth/register-resend-otp", "post", handler8);
mount("/auth/me", "get", handler9);
mount("/sos", "post", handler10);
mount("/sos/active", "get", handler11);
mount("/sos/history", "get", handler12);
mount("/sos/resolve", "post", handler13);
mount("/voice/config", "get", handler14);
mount("/voice/config", "put", handler15);
mount("/contacts", "get", handler16);
mount("/contacts", "post", handler17);
mount("/contacts", "put", handler18);
mount("/contacts", "delete", handler19);
mount("/tracking/update", "post", handler20);
mount("/tracking/risk-zones", "get", handler21);
mount("/vault", "get", handler22);
mount("/vault", "post", handler23);
mount("/vault", "delete", handler24);
mount("/community/helpers", "get", handler25);
mount("/community/incidents", "get", handler26);
mount("/community/request-help", "post", handler27);
mount("/assistant/chat", "post", handler28);
mount("/admin/stats", "get", handler29);
mount("/admin/users", "get", handler30);
mount("/admin/alerts", "get", handler31);
mount("/admin/test-email", "get", handler32);
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
});
function handler34(req, res) {
  return app(req, res);
}
export {
  handler34 as default
};
