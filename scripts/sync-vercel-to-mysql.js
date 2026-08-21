import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function syncVercelToMySQL() {
  console.log('====================================================');
  console.log('🔄 JanSuraksha AI — Sync Vercel Cloud Data to MySQL');
  console.log('====================================================\n');

  const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || (connectionUri ? undefined : 'localhost');
  const user = process.env.MYSQL_USER || (connectionUri ? undefined : 'root');
  const password = process.env.MYSQL_PASSWORD ?? (connectionUri ? undefined : '');
  const database = process.env.MYSQL_DATABASE || (connectionUri ? undefined : 'jansuraksha_db');
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

  let connection;
  try {
    // 1. Connect to MySQL
    if (connectionUri) {
      connection = await mysql.createConnection(connectionUri);
    } else {
      connection = await mysql.createConnection({ host, user, password, database, port });
    }
    console.log(`✅ Connected to MySQL: ${user}@${host}:${port}/${database}`);

    // Ensure table exists
    await connection.query(`
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

    // 2. Fetch live users from Vercel Production
    console.log('📡 Fetching registered users from live Vercel cloud (https://jansuraksha-ai.vercel.app)...');
    const response = await fetch('https://jansuraksha-ai.vercel.app/api/admin/users');
    const data = await response.json();

    if (!data.success || !Array.isArray(data.users)) {
      throw new Error(`Failed to fetch users: ${JSON.stringify(data)}`);
    }

    console.log(`📥 Found ${data.users.length} users in live cloud database.`);

    // 3. Insert / Update each user into MySQL
    let insertedCount = 0;
    for (const u of data.users) {
      const role = u.email.toLowerCase() === 'ec23019@glbitm.ac.in' ? 'admin' : 'user';
      await connection.query(
        `INSERT INTO users (id, name, email, password_hash, phone, role, plan, safety_score, avatar, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), role = VALUES(role), plan = VALUES(plan), location = VALUES(location)`,
        [
          u.id || `u_${Date.now()}`,
          u.name || 'User',
          u.email.toLowerCase(),
          '$2a$10$3s8FzV8i5QZtT61w/bYVpOkN1jN6rX.hS0H2QZ5pT0aQ7r9p3hC.',
          u.phone || '+91 98765 43210',
          role,
          u.plan || (role === 'admin' ? 'Premium' : 'Free'),
          u.safetyScore || 85,
          u.name ? u.name.slice(0, 2).toUpperCase() : 'JS',
          u.location || 'India',
        ]
      );
      insertedCount++;
    }

    console.log(`\n🎉 Successfully synchronized ${insertedCount} users into MySQL 'users' table!\n`);

    // 4. Print current table
    const [rows] = await connection.query('SELECT id, name, email, phone, role, plan FROM users ORDER BY role ASC, name ASC');
    console.table(rows);

  } catch (err) {
    console.error('❌ Sync Error:', err.message);
    console.log('\n💡 Note: Make sure MySQL is running in XAMPP or Windows Services.');
  } finally {
    if (connection) await connection.end();
  }
}

syncVercelToMySQL();
