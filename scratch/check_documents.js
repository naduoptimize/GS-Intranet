const db = require('../backend/config/db');

async function run() {
    try {
        const [rows] = await db.execute('SELECT id, title, category, subsidiary_id, file_url FROM documents');
        console.log('--- DOCUMENTS IN DATABASE ---');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
