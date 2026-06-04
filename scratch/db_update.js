const db = require('../backend/config/db');

async function update() {
    try {
        console.log('Updating subadmin subsidiary association...');
        await db.execute('UPDATE users SET subsidiary_id = 1 WHERE email = ?', ['subadmin@gmail.com']);
        console.log('Successfully set subsidiary_id = 1 for subadmin@gmail.com');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

update();
