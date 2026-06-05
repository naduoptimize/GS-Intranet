const db = require('./config/db');

async function createTicketsTables() {
    try {
        console.log('Creating tickets and ticketing-related tables...');

        // 1. Create tickets table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_no VARCHAR(50) UNIQUE NULL,
                user_id INT NOT NULL,
                assigned_to_id INT NULL,
                subject VARCHAR(255) NOT NULL,
                department ENUM('it', 'hr', 'general') NOT NULL,
                category VARCHAR(100),
                priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
                description TEXT NOT NULL,
                status ENUM('open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open',
                assigned_to VARCHAR(255),
                assigned_email VARCHAR(255),
                sla_deadline TIMESTAMP NULL,
                employee_deadline TIMESTAMP NULL,
                resolution_date TIMESTAMP NULL,
                resolution_notes TEXT NULL,
                rating INT NULL,
                feedback TEXT NULL,
                extension_reason TEXT NULL,
                extended_by_name VARCHAR(255) NULL,
                extended_by_role VARCHAR(100) NULL,
                extended_on TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('tickets table created or already exists.');

        // 2. Create ticket_comments table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('ticket_comments table created or already exists.');

        // 3. Create ticket_attachments table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                uploaded_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('ticket_attachments table created or already exists.');

        // 4. Create ticket_audit_logs table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ticket_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                details TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('ticket_audit_logs table created or already exists.');

        // 5. Create ticket_internal_notes table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ticket_internal_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                note TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('ticket_internal_notes table created or already exists.');

        // 6. Create ticket_deadline_history table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ticket_deadline_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                old_deadline TIMESTAMP NULL,
                new_deadline TIMESTAMP NULL,
                reason TEXT NOT NULL,
                updated_by_id INT NOT NULL,
                updated_by_name VARCHAR(255) NOT NULL,
                updated_by_role VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('ticket_deadline_history table created or already exists.');

        console.log('All ticketing tables setup successfully.');
    } catch (err) {
        console.error('Error creating tickets tables:', err);
    } finally {
        process.exit();
    }
}

createTicketsTables();
