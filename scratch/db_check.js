const db = require('../backend/config/db');

async function check() {
    try {
        console.log('--- USERS ---');
        const [users] = await db.execute('SELECT id, full_name, email, role, subsidiary_id, is_active FROM users');
        console.log(users);

        console.log('--- SUBSIDIARIES ---');
        const [subs] = await db.execute('SELECT id, name FROM subsidiaries');
        console.log(subs);

        console.log('--- DOCUMENTS ---');
        const [docs] = await db.execute('SELECT id, title, subsidiary_id FROM documents');
        console.log(docs);

        console.log('--- POSTS ---');
        const [posts] = await db.execute('SELECT id, content, subsidiary_id, visibility FROM posts');
        console.log(posts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
