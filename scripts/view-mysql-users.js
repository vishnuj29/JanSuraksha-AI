import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  console.log('====================================================');
  console.log('🛡️ JanSuraksha AI — MySQL Database Inspection Tool');
  console.log('====================================================\n');

  const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || (connectionUri ? undefined : 'localhost');
  const user = process.env.MYSQL_USER || (connectionUri ? undefined : 'root');
  const password = process.env.MYSQL_PASSWORD ?? (connectionUri ? undefined : '');
  const database = process.env.MYSQL_DATABASE || (connectionUri ? undefined : 'jansuraksha_db');
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

  let connection;
  try {
    if (connectionUri) {
      console.log(`Connecting via URI: ${connectionUri.replace(/:[^:@]+@/, ':****@')}`);
      connection = await mysql.createConnection(connectionUri);
    } else {
      console.log(`Connecting to: ${user}@${host}:${port}/${database}`);
      connection = await mysql.createConnection({ host, user, password, database, port });
    }

    console.log('✅ Connected to MySQL successfully!\n');

    // 1. Check Users
    const [users] = await connection.query('SELECT id, name, email, phone, role, plan, created_at FROM users ORDER BY created_at DESC');
    console.log(`👥 Registered Users (${users.length}):`);
    console.table(users);

    // 2. Check SOS Alerts
    const [alerts] = await connection.query('SELECT id, user_name, user_email, alert_type, status, address, created_at FROM sos_alerts ORDER BY created_at DESC LIMIT 10');
    console.log(`\n🚨 Recent SOS Alerts (${alerts.length}):`);
    console.table(alerts);

  } catch (err) {
    console.error('❌ MySQL Connection / Query Error:', err.message);
    console.log('\n💡 Tip: To connect to local MySQL:');
    console.log('1. Start MySQL in XAMPP or MySQL Service.');
    console.log('2. Create database: `CREATE DATABASE jansuraksha_db;` and import `database/schema.sql`.');
    console.log('3. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD in .env or provide MYSQL_URL.\n');
  } finally {
    if (connection) await connection.end();
  }
}

main();
