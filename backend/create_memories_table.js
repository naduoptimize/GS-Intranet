const db = require('./config/db');

async function createMemoriesTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS memories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url VARCHAR(255) NOT NULL,
                author_id INT,
                subsidiary_id INT, -- Optional: if the memory is subsidiary-specific
                likes_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL
            )
        `;
        await db.execute(query);
        console.log('Memories table created or already exists.');

        // Add sample memories
        const sampleMemories = [
            {
                title: 'Group Annual Cricket Match 2026',
                description: 'A thrilling day at the grounds! GS Health took the trophy this year. Amazing teamwork by everyone.',
                image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000',
                author_id: 1
            },
            {
                title: 'GS Teas Town Hall',
                description: 'Connecting our heritage with our future. Great insights shared by our directors.',
                image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000',
                author_id: 1
            },
            {
                title: 'Team Outing - Citrus Leisure',
                description: 'Sun, sand, and strategy! Our leadership team recharging at Citrus Waskaduwa.',
                image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000',
                author_id: 1
            }
        ];

        for (const memory of sampleMemories) {
            const [existing] = await db.execute('SELECT * FROM memories WHERE title = ?', [memory.title]);
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO memories (title, description, image_url, author_id) VALUES (?, ?, ?, ?)',
                    [memory.title, memory.description, memory.image_url, memory.author_id]
                );
                console.log(`Added sample memory: ${memory.title}`);
            }
        }

    } catch (err) {
        console.error('Error creating memories table:', err);
    } finally {
        process.exit();
    }
}

createMemoriesTable();
