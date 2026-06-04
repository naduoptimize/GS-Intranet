const db = require('../backend/config/db');

async function check() {
  try {
    const [columns] = await db.query('DESCRIBE reactions');
    console.log('Reactions Columns:', columns);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

check();
