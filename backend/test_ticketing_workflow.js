const axios = require('axios');

const API = 'http://localhost:5000/api';

async function runTest() {
    console.log("=== STARTING TICKETING WORKFLOW TEST ===");
    try {
        // 1. Fetch user IDs for employee, IT Admin, and IT Staff
        console.log("\n1. Fetching user database records...");
        const usersRes = await axios.get(`${API}/users`);
        const users = usersRes.data;

        const employee = users.find(u => u.email === 'employee@gs.com');
        const itAdmin = users.find(u => u.email === 'itadmin@gs.com');
        const itStaff = users.find(u => u.email === 'itstaff@gs.com');

        if (!employee || !itAdmin || !itStaff) {
            throw new Error("Required test users not found in the database. Run seed script first.");
        }

        console.log(`- Employee: ${employee.full_name} (ID: ${employee.id})`);
        console.log(`- IT Admin: ${itAdmin.full_name} (ID: ${itAdmin.id})`);
        console.log(`- IT Staff: ${itStaff.full_name} (ID: ${itStaff.id})`);

        // 2. Lodge a ticket as employee
        console.log("\n2. Lodging a new IT ticket as employee...");
        const submitRes = await axios.post(`${API}/tickets`, {
            userId: employee.id,
            subject: 'Test Ticket: Intranet connection slow',
            department: 'it',
            category: 'Network',
            priority: 'high',
            description: 'The intranet portal is taking a very long time to load resources today.'
        });

        const { id: ticketId, ticket_no: ticketNo } = submitRes.data;
        console.log(`- Ticket created: ${ticketNo} (ID: ${ticketId})`);

        // 3. Check analytics summary
        console.log("\n3. Fetching IT department analytics summary...");
        const analyticsRes = await axios.get(`${API}/tickets/analytics/summary`, {
            params: { department: 'it' }
        });
        console.log("- Summary counters:", analyticsRes.data.summary);
        console.log("- Team workload count:", analyticsRes.data.teamWorkload.length);

        // 4. Assign the ticket to IT Staff (IT Admin does this)
        console.log(`\n4. Assigning ticket ${ticketNo} to ${itStaff.full_name}...`);
        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'assigned',
            assigned_to_id: itStaff.id,
            current_user_id: itAdmin.id
        });
        console.log("- Ticket assigned successfully.");

        // 5. Update ticket status to In Progress (IT Staff does this)
        console.log("\n5. Updating ticket status to 'in_progress' by IT Staff...");
        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'in_progress',
            current_user_id: itStaff.id
        });
        console.log("- Ticket status changed to In Progress.");

        // 6. Post a comment
        console.log("\n6. Adding a comment on the ticket...");
        await axios.post(`${API}/tickets/${ticketId}/comments`, {
            userId: itStaff.id,
            comment: 'Working on checking the bandwidth logs for today.'
        });
        console.log("- Comment posted successfully.");

        // 7. Resolve the ticket
        console.log("\n7. Resolving ticket...");
        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'resolved',
            resolution_notes: 'Rebooted the local subnet router, performance restored.',
            current_user_id: itStaff.id
        });
        console.log("- Ticket resolved.");

        // 8. Submit feedback/rating (Employee does this, which closes the ticket)
        console.log("\n8. Submitting satisfaction rating and closing ticket...");
        await axios.put(`${API}/tickets/${ticketId}/rate`, {
            rating: 5,
            feedback: 'Excellent response time and direct fix. Thanks!',
            userId: employee.id
        });
        console.log("- Ticket rated and closed.");

        // 9. Fetch details to confirm state
        console.log("\n9. Fetching final ticket details...");
        const detailsRes = await axios.get(`${API}/tickets/${ticketId}/details`);
        const { ticket, comments, logs } = detailsRes.data;

        console.log(`- Final Status: ${ticket.status}`);
        console.log(`- Final Rating: ${ticket.rating}/5`);
        console.log(`- Resolution notes: ${ticket.resolution_notes}`);
        console.log(`- Comments count: ${comments.length}`);
        console.log(`- Audit logs count: ${logs.length}`);

        console.log("\n=== ALL WORKFLOW TESTS PASSED SUCCESSFULLY ===");
    } catch (err) {
        console.error("Workflow test failed:", err.message);
        if (err.response) {
            console.error("Response error data:", err.response.data);
        }
        process.exit(1);
    }
}

runTest();
