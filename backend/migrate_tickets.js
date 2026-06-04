const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gs_intranet'
    });
    
    console.log("Migrating database for Ticketing System Redesign...");

    // Disable foreign key checks temporarily to perform modifications
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    try {
        // 1. Check/Add columns in 'tickets' table
        const [columns] = await connection.query("SHOW COLUMNS FROM tickets");
        const columnNames = columns.map(c => c.Field);

        console.log("Existing tickets columns:", columnNames);

        // Map 'admin' department to 'general' before altering the column
        if (columnNames.includes('department')) {
            console.log("Mapping 'admin' department to 'general'...");
            await connection.query("UPDATE tickets SET department = 'general' WHERE department = 'admin'");
            await connection.query("UPDATE tickets SET department = 'general' WHERE department NOT IN ('it', 'hr')");
        }

        // Alter 'department' column to support ENUM('it', 'hr', 'general')
        console.log("Altering 'department' column in tickets...");
        await connection.query(`
            ALTER TABLE tickets MODIFY COLUMN department ENUM('it', 'hr', 'general') NOT NULL
        `);

        // Map 'pending' status to 'open' if necessary, or just keep it.
        // Let's modify status enum to support 'open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed'
        console.log("Altering 'status' column in tickets...");
        await connection.query(`
            ALTER TABLE tickets MODIFY COLUMN status ENUM('open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open'
        `);

        // Add 'ticket_no' VARCHAR(50) UNIQUE if it doesn't exist
        if (!columnNames.includes('ticket_no')) {
            console.log("Adding 'ticket_no' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN ticket_no VARCHAR(50) NULL AFTER id
            `);
        }

        // Add 'assigned_to_id' INT NULL referencing users(id) if it doesn't exist
        if (!columnNames.includes('assigned_to_id')) {
            console.log("Adding 'assigned_to_id' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN assigned_to_id INT NULL AFTER user_id,
                ADD CONSTRAINT fk_tickets_assigned_to_id FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
            `);
        }

        // Add 'updated_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP if it doesn't exist
        if (!columnNames.includes('updated_at')) {
            console.log("Adding 'updated_at' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
            `);
        }

        // Add 'resolution_date' TIMESTAMP NULL if it doesn't exist
        if (!columnNames.includes('resolution_date')) {
            console.log("Adding 'resolution_date' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN resolution_date TIMESTAMP NULL AFTER updated_at
            `);
        }

        // Add 'sla_deadline' TIMESTAMP NULL if it doesn't exist
        if (!columnNames.includes('sla_deadline')) {
            console.log("Adding 'sla_deadline' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN sla_deadline TIMESTAMP NULL AFTER resolution_date
            `);
        }

        // Drop 'rating' and 'feedback_comments' if they exist or just alter them.
        // In the original, rating is int(11) and feedback_comments is text. Let's make sure we have 'rating' and 'feedback'
        if (!columnNames.includes('feedback') && columnNames.includes('feedback_comments')) {
            console.log("Renaming 'feedback_comments' to 'feedback'...");
            await connection.query(`
                ALTER TABLE tickets CHANGE COLUMN feedback_comments feedback TEXT NULL
            `);
        } else if (!columnNames.includes('feedback')) {
            console.log("Adding 'feedback' column...");
            await connection.query(`
                ALTER TABLE tickets ADD COLUMN feedback TEXT NULL
            `);
        }

        // Backfill ticket_no for existing tickets
        console.log("Backfilling ticket_no for existing tickets...");
        await connection.query(`
            UPDATE tickets SET ticket_no = CONCAT('TIC-', LPAD(id, 4, '0')) WHERE ticket_no IS NULL OR ticket_no = ''
        `);

        // Add UNIQUE constraint on ticket_no if not already added
        try {
            await connection.query(`
                ALTER TABLE tickets ADD UNIQUE INDEX idx_ticket_no (ticket_no)
            `);
            console.log("Unique index on ticket_no added.");
        } catch (e) {
            console.log("Unique index on ticket_no already exists or skipped.");
        }

        // 2. Create 'ticket_comments' table
        console.log("Creating 'ticket_comments' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Create 'ticket_attachments' table
        console.log("Creating 'ticket_attachments' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                uploaded_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 4. Create 'ticket_audit_logs' table
        console.log("Creating 'ticket_audit_logs' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                user_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                details TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log("Migration completed successfully!");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.end();
    }
}

migrate();
