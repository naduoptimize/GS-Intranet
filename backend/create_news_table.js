const db = require('./config/db');

async function createNewsTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(255),
                category VARCHAR(100),
                author_id INT,
                publish_date DATE,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        await db.execute(query);
        console.log('News table created or already exists.');
        
        // Add sample news
        const sampleNews = [
            {
                title: 'GS Teas Celebrates 185 Years of Heritage',
                content: 'George Steuart Teas, a leading exporter of Ceylon Tea, recently celebrated its 185th anniversary with a grand event in Colombo...',
                image_url: 'https://georgesteuart.lk/media/news_1.jpg',
                category: 'Corporate',
                publish_date: '2026-05-10'
            },
            {
                title: 'New Digital Transformation Initiative Launched',
                content: 'George Steuart Optimize has launched a new initiative to accelerate digital transformation across all subsidiaries of the group...',
                image_url: 'https://georgesteuart.lk/media/news_2.jpg',
                category: 'Technology',
                publish_date: '2026-05-12'
            },
            {
                title: 'GS Health Partners with Global Pharma Leader',
                content: 'George Steuart Health has signed a strategic partnership agreement with a global pharmaceutical leader to bring innovative treatments to Sri Lanka...',
                image_url: 'https://georgesteuart.lk/media/news_3.jpg',
                category: 'Healthcare',
                publish_date: '2026-05-14'
            }
        ];

        for (const news of sampleNews) {
            const [existing] = await db.execute('SELECT * FROM news WHERE title = ?', [news.title]);
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO news (title, content, image_url, category, publish_date) VALUES (?, ?, ?, ?, ?)',
                    [news.title, news.content, news.image_url, news.category, news.publish_date]
                );
                console.log(`Added sample news: ${news.title}`);
            }
        }

    } catch (err) {
        console.error('Error creating news table:', err);
    } finally {
        process.exit();
    }
}

createNewsTable();
