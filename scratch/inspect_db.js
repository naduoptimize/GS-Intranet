const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gs_intranet'
    });
    
    console.log("Connected to database:", process.env.DB_NAME);
    
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in database:", tables.map(t => Object.values(t)[0]));
    
    try {
        const [userCols] = await connection.query("DESCRIBE users");
        console.log("\nUsers table structure:");
        console.table(userCols);
    } catch (e) {
        console.error("Error describing users:", e.message);
    }

    try {
        const [ticketCols] = await connection.query("DESCRIBE tickets");
        console.log("\nTickets table structure:");
        console.table(ticketCols);
    } catch (e) {
        console.log("\nTickets table does not exist or error:", e.message);
    }

    await connection.end();
}

run().catch(console.error);
