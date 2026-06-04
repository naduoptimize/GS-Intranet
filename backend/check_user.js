const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', ['chanika@gsoptimize.lk']);
        console.log('Chanika User Record:', rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
