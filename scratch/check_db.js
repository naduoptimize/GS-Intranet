const db = require('../backend/config/db');

async function test() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables:', tables);

    const [posts] = await db.query('SELECT * FROM posts');
    console.log('Posts:', posts);

    const [comments] = await db.query('SELECT * FROM comments');
    console.log('Comments:', comments);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

test();
