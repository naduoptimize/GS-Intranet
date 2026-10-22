const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gs_intranet'
    });

    console.log("Normalizing existing roles in users table...");

    // Update super_admin -> superadmin
    await conn.query("UPDATE users SET role = 'superadmin' WHERE role = 'super_admin'");

    // Update it_admin, hr_admin -> groupadmin
    await conn.query("UPDATE users SET role = 'groupadmin' WHERE role IN ('it_admin', 'hr_admin')");

    // Update it_staff, hr_staff -> employee
    await conn.query("UPDATE users SET role = 'employee' WHERE role IN ('it_staff', 'hr_staff')");

    // Update sub_admin -> subadmin
    await conn.query("UPDATE users SET role = 'subadmin' WHERE role = 'sub_admin'");

    const [users] = await conn.query("SELECT id, full_name, email, role, subsidiary_id FROM users");
    console.table(users);

    const [roleCounts] = await conn.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    console.table(roleCounts);

    await conn.end();
}

run().catch(console.error);
