const db = require('./config/db');

async function createMemoryLikesTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS memory_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                memory_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_memory_user (memory_id, user_id),
                FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await db.execute(query);
        console.log('memory_likes table created or already exists.');
    } catch (err) {
        console.error('Error creating memory_likes table:', err);
    } finally {
        process.exit();
    }
}

createMemoryLikesTable();
