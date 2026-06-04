const db = require('../backend/config/db');

async function run() {
    try {
        console.log('Altering news table to add subsidiary_id column...');
        
        // Add subsidiary_id column if not exists
        const [columns] = await db.execute('SHOW COLUMNS FROM news LIKE "subsidiary_id"');
        if (columns.length === 0) {
            await db.execute('ALTER TABLE news ADD COLUMN subsidiary_id INT NULL');
            await db.execute('ALTER TABLE news ADD CONSTRAINT fk_news_subsidiary FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL');
            console.log('Column subsidiary_id successfully added to news table with foreign key constraint ✓');
        } else {
            console.log('Column subsidiary_id already exists in news table.');
        }

        // Set default subsidiary_id = 1 for the existing sample news
        await db.execute('UPDATE news SET subsidiary_id = 1 WHERE subsidiary_id IS NULL');
        console.log('Assigned existing sample news to George Steuart & Co. (ID 1) ✓');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

run();
