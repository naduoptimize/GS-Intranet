const db = require('./config/db');

async function repair() {
    try {
        console.log('Starting missing tables repair...');

        // 1. Create new_joiners table
        console.log('Creating new_joiners table...');
        const createJoinersQuery = `
            CREATE TABLE IF NOT EXISTS new_joiners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255) NOT NULL,
                join_date DATE NOT NULL,
                profile_photo VARCHAR(255) DEFAULT NULL,
                group_image VARCHAR(255) DEFAULT NULL,
                group_details TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subsidiary_id INT DEFAULT NULL,
                FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        await db.execute(createJoinersQuery);
        console.log('✅ new_joiners table created or already exists.');

        // 2. Create offers table
        console.log('Creating offers table...');
        const createOffersQuery = `
            CREATE TABLE IF NOT EXISTS offers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                badge VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                cta VARCHAR(50) NOT NULL,
                gradient VARCHAR(100) NOT NULL,
                emoji VARCHAR(50) NOT NULL,
                image_url VARCHAR(500) DEFAULT NULL,
                valid_until VARCHAR(100) NOT NULL,
                savings VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subsidiary_id INT DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        await db.execute(createOffersQuery);
        console.log('✅ offers table created or already exists.');

        console.log('Tables repair finished successfully.');
    } catch (err) {
        console.error('❌ Error during tables repair:', err);
    } finally {
        process.exit();
    }
}

repair();
