const db = require('../backend/config/db');

async function checkUsers() {
    try {
        const [rows] = await db.execute('SELECT full_name, email, role FROM users');
        console.log('Current Users in Database:');
        console.table(rows);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
