const db = require('./config/db');

async function repair() {
    try {
        console.log('Checking for missing schema elements and repairing them...');

        // 1. Add date_of_birth to users table
        try {
            await db.execute('ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER bio');
            console.log('✅ Added date_of_birth column to users table.');
        } catch (e) {
            console.log('ℹ️ date_of_birth column might already exist:', e.message);
        }

        // 2. Add is_pinned to posts table
        try {
            await db.execute('ALTER TABLE posts ADD COLUMN is_pinned TINYINT(1) DEFAULT 0 AFTER type');
            console.log('✅ Added is_pinned column to posts table.');
        } catch (e) {
            console.log('ℹ️ is_pinned column might already exist:', e.message);
        }

        // 3. Create messages table
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    message_text TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('✅ Created messages table.');
        } catch (e) {
            console.log('❌ Error creating messages table:', e.message);
        }

        // 4. Update seed data to give some dates of birth
        try {
            await db.execute("UPDATE users SET date_of_birth = '1990-05-15' WHERE email = 'employee@gs.com'");
            await db.execute("UPDATE users SET date_of_birth = '1985-08-20' WHERE email = 'admin@gs.com'");
            console.log('✅ Updated users seed dates of birth.');
        } catch (e) {
            console.log('❌ Error updating birth dates:', e.message);
        }

        console.log('All schema repairs checked and completed.');
    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        process.exit();
    }
}

repair();
