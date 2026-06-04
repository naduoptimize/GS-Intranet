const db = require('./config/db');

async function createAlertsTable() {
    try {
        console.log('Creating alerts table...');
        const query = `
            CREATE TABLE IF NOT EXISTS alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('warning', 'info', 'success') NOT NULL,
                color ENUM('amber', 'blue', 'emerald') NOT NULL,
                subsidiary_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        await db.execute(query);
        console.log('Alerts table created or already exists.');
        
        // Add sample alerts
        const sampleAlerts = [
            {
                title: 'IT Maintenance Window',
                message: 'Scheduled server maintenance on Sunday 25 May, 11 PM – 2 AM. Some services may be unavailable.',
                type: 'warning',
                color: 'amber',
                subsidiary_id: null
            },
            {
                title: 'Leave Submission Deadline',
                message: 'All annual leave requests for June must be submitted via WISE HRIS by 30 May 2026.',
                type: 'info',
                color: 'blue',
                subsidiary_id: null
            },
            {
                title: 'New Security Policy',
                message: 'Please review and acknowledge the updated Information Security Policy in the Document Center.',
                type: 'success',
                color: 'emerald',
                subsidiary_id: null
            }
        ];

        for (const alert of sampleAlerts) {
            const [existing] = await db.execute('SELECT * FROM alerts WHERE title = ? AND message = ?', [alert.title, alert.message]);
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO alerts (title, message, type, color, subsidiary_id) VALUES (?, ?, ?, ?, ?)',
                    [alert.title, alert.message, alert.type, alert.color, alert.subsidiary_id]
                );
                console.log(`Added sample alert: ${alert.title}`);
            }
        }
        console.log('Seeding finished successfully.');

    } catch (err) {
        console.error('Error creating alerts table:', err);
    } finally {
        process.exit();
    }
}

createAlertsTable();
