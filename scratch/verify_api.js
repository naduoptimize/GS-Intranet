const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function runVerify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gs_intranet'
    });

    console.log('Connected to MySQL DB.');

    // 1. Create a test ticket using direct DB insertion or API
    // Let's do it via DB insertion to check model capability, then update via API
    const testUserId = 1; // Assuming user ID 1 exists
    const subject = "Verification Ticket - Deadline Feature";
    const department = "it";
    const category = "Hardware";
    const priority = "high";
    const description = "Testing custom SLA deadline handling.";
    const status = "open";
    const customDeadline = "2026-06-15 10:00:00";

    console.log('Inserting verification ticket...');
    const [insertRes] = await connection.execute(
        `INSERT INTO tickets (user_id, subject, department, category, priority, description, status, sla_deadline)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [testUserId, subject, department, category, priority, description, status, customDeadline]
    );
    const ticketId = insertRes.insertId;
    console.log(`Inserted ticket with ID: ${ticketId}`);

    // Retrieve the ticket and verify sla_deadline matches
    const [rows] = await connection.execute(
        'SELECT sla_deadline, ticket_no FROM tickets WHERE id = ?',
        [ticketId]
    );
    console.log('Initial SLA Deadline in DB:', rows[0].sla_deadline);
    const initialDeadline = new Date(rows[0].sla_deadline).toISOString().replace('.000Z', '').replace('T', ' ');
    console.log('Formatted SLA Deadline:', initialDeadline);

    if (rows[0].sla_deadline && rows[0].sla_deadline.includes('2026-06-15')) {
        console.log('✅ Ticket creation with custom deadline: SUCCESS');
    } else {
        console.error('❌ Ticket creation with custom deadline: FAILED. Received:', rows[0].sla_deadline);
    }

    // Now let's try updating it via the API
    const updatePayload = {
        status: "in_progress",
        sla_deadline: "2026-06-20T14:30:00.000Z",
        current_user_id: testUserId,
        assigned_to_id: testUserId
    };

    console.log('Sending PUT request to update ticket deadline and status...');
    const http = require('http');
    const postData = JSON.stringify(updatePayload);

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/tickets/${ticketId}/status`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', async () => {
            console.log('PUT Response Status:', res.statusCode);
            console.log('PUT Response Body:', body);

            // Re-fetch ticket to verify updated sla_deadline and status
            const [updatedRows] = await connection.execute(
                'SELECT status, sla_deadline FROM tickets WHERE id = ?',
                [ticketId]
            );

            console.log('Updated Status in DB:', updatedRows[0].status);
            console.log('Updated SLA Deadline in DB:', updatedRows[0].sla_deadline);

            if (updatedRows[0].status === 'in_progress' && updatedRows[0].sla_deadline && updatedRows[0].sla_deadline.includes('2026-06-20')) {
                console.log('✅ Ticket deadline and status update via API: SUCCESS');
            } else {
                console.error('❌ Ticket deadline and status update via API: FAILED');
            }

            // Cleanup test ticket
            console.log('Cleaning up test ticket...');
            await connection.execute('DELETE FROM ticket_audit_logs WHERE ticket_id = ?', [ticketId]);
            await connection.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
            console.log('Test ticket deleted.');
            await connection.end();
            process.exit(0);
        });
    });

    req.on('error', async (e) => {
        console.error('API Request Error:', e);
        await connection.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
        await connection.end();
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

runVerify().catch(err => {
    console.error('Error running test script:', err);
    process.exit(1);
});
