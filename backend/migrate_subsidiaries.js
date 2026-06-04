const db = require('./config/db');

async function migrate() {
    try {
        console.log('Running migrations...');
        
        // 1. Add mission and vision to subsidiaries
        console.log('Adding mission and vision columns...');
        try {
            await db.execute('ALTER TABLE subsidiaries ADD COLUMN mission TEXT');
            console.log('Added mission column.');
        } catch (e) {
            console.log('mission column might already exist:', e.message);
        }

        try {
            await db.execute('ALTER TABLE subsidiaries ADD COLUMN vision TEXT');
            console.log('Added vision column.');
        } catch (e) {
            console.log('vision column might already exist:', e.message);
        }

        // 2. Create subsidiary_directors table
        console.log('Creating subsidiary_directors table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS subsidiary_directors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subsidiary_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                title VARCHAR(255),
                bio TEXT,
                image_url VARCHAR(255),
                FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
            )
        `);
        console.log('Table subsidiary_directors created.');

        // 3. Add phone_2 to subsidiaries
        console.log('Adding phone_2 column...');
        try {
            await db.execute('ALTER TABLE subsidiaries ADD COLUMN phone_2 VARCHAR(255)');
            console.log('Added phone_2 column.');
        } catch (e) {
            console.log('phone_2 column might already exist:', e.message);
        }

        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
