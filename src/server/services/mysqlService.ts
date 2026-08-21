import mysql from 'mysql2/promise';

export interface MySQLUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: 'admin' | 'user';
  plan: string;
  safety_score: number;
  avatar: string;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface MySQLSOSRow {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  alert_type: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  address?: string;
  status: 'Active' | 'Resolved' | 'Escalated' | 'False Alarm';
  responders_notified: number;
  trigger_phrase?: string;
  created_at: Date;
}

class MySQLService {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;

  private getPool(): mysql.Pool | null {
    if (this.pool) return this.pool;

    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const host = process.env.MYSQL_HOST || (connectionUri ? undefined : 'localhost');
    const user = process.env.MYSQL_USER || (connectionUri ? undefined : 'root');
    const password = process.env.MYSQL_PASSWORD ?? (connectionUri ? undefined : '');
    const database = process.env.MYSQL_DATABASE || (connectionUri ? undefined : 'jansuraksha_db');
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

    try {
      if (connectionUri) {
        this.pool = mysql.createPool({
          uri: connectionUri,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          ssl: connectionUri.includes('ssl') ? { rejectUnauthorized: false } : undefined,
        });
        console.log('[MySQL] 🐬 Pool connected via Connection URI');
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
          queueLimit: 0,
        });
        console.log(`[MySQL] 🐬 Pool connected to host: ${host}:${port}, database: ${database}`);
        return this.pool;
      }
    } catch (err) {
      console.warn('[MySQL] ⚠️ Could not initialize MySQL pool:', err);
    }

    return null;
  }

  public async initSchema(): Promise<boolean> {
    if (this.isInitialized) return true;
    const pool = this.getPool();
    if (!pool) return false;

    try {
      // 1. Users table
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

      // 2. SOS Alerts table
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

      // 3. OTP records table
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

      // 4. Seed Fixed Super Admin
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
      console.log('[MySQL] ✅ Schema initialized & Super Admin ec23019@glbitm.ac.in verified in MySQL');
      return true;
    } catch (err) {
      console.warn('[MySQL] ⚠️ Schema initialization skipped or failed:', err);
      return false;
    }
  }

  public async getAllUsers(): Promise<MySQLUserRow[]> {
    const pool = this.getPool();
    if (!pool) return [];
    try {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return rows as MySQLUserRow[];
    } catch (err) {
      console.error('[MySQL] Query users failed:', err);
      return [];
    }
  }

  public async getUserByEmail(email: string): Promise<MySQLUserRow | null> {
    const pool = this.getPool();
    if (!pool) return null;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
      const list = rows as MySQLUserRow[];
      return list.length > 0 ? list[0] : null;
    } catch (err) {
      console.error('[MySQL] Find user failed:', err);
      return null;
    }
  }

  public async insertUser(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    role?: 'admin' | 'user';
    plan?: string;
    safetyScore?: number;
    avatar?: string;
    location?: string;
  }): Promise<boolean> {
    const pool = this.getPool();
    if (!pool) return false;
    try {
      const role = user.email.toLowerCase() === 'ec23019@glbitm.ac.in' ? 'admin' : (user.role || 'user');
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
          user.plan || 'Free',
          user.safetyScore || 80,
          user.avatar || 'JS',
          user.location || 'India',
        ]
      );
      return true;
    } catch (err) {
      console.error('[MySQL] Insert user failed:', err);
      return false;
    }
  }

  public async insertSOSAlert(alert: {
    id: string;
    userId?: string;
    userName: string;
    userEmail: string;
    alertType: string;
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
    address?: string;
    status?: 'Active' | 'Resolved' | 'Escalated' | 'False Alarm';
    respondersNotified?: number;
    triggerPhrase?: string;
  }): Promise<boolean> {
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
          alert.status || 'Active',
          alert.respondersNotified || 3,
          alert.triggerPhrase || null,
        ]
      );
      return true;
    } catch (err) {
      console.error('[MySQL] Insert SOS Alert failed:', err);
      return false;
    }
  }

  public async getAllAlerts(): Promise<MySQLSOSRow[]> {
    const pool = this.getPool();
    if (!pool) return [];
    try {
      const [rows] = await pool.query('SELECT * FROM sos_alerts ORDER BY created_at DESC');
      return rows as MySQLSOSRow[];
    } catch (err) {
      console.error('[MySQL] Query alerts failed:', err);
      return [];
    }
  }

  public async getStatus() {
    const pool = this.getPool();
    if (!pool) {
      return {
        connected: false,
        driver: 'mysql2',
        message: 'MySQL pool not configured. Set MYSQL_URL or MYSQL_HOST in your environment.',
      };
    }

    try {
      const [userCountResult]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      const [alertCountResult]: any = await pool.query('SELECT COUNT(*) as count FROM sos_alerts');

      return {
        connected: true,
        driver: 'mysql2',
        database: process.env.MYSQL_DATABASE || 'jansuraksha_db',
        totalUsers: userCountResult[0]?.count || 0,
        totalAlerts: alertCountResult[0]?.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        driver: 'mysql2',
        error: err?.message || 'Failed to ping MySQL server',
      };
    }
  }
}

export const mysqlService = new MySQLService();
