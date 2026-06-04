const axios = require('axios');

const API = 'http://localhost:5000/api';

async function runTest() {
    console.log("=== STARTING DEADLINE HISTORY WORKFLOW TEST ===");
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

        // 2. Lodge a ticket as employee with a custom deadline
        console.log("\n2. Lodging a new IT ticket as employee with a custom deadline...");
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        tomorrow.setMilliseconds(0);
        const tomorrowIso = tomorrow.toISOString();

        const submitRes = await axios.post(`${API}/tickets`, {
            userId: employee.id,
            subject: 'Test Ticket: Slow PC Performance',
            department: 'it',
            category: 'Hardware Issue',
            priority: 'medium',
            description: 'My laptop takes 15 minutes to boot up and apps crash frequently.',
            deadline: tomorrowIso
        });

        const { id: ticketId, ticket_no: ticketNo } = submitRes.data;
        console.log(`- Ticket created: ${ticketNo} (ID: ${ticketId})`);

        // 3. Verify original deadlines are matching
        console.log("\n3. Verifying initial ticket deadlines...");
        let detailsRes = await axios.get(`${API}/tickets/${ticketId}/details`);
        let { ticket } = detailsRes.data;
        
        console.log(`- Original employee_deadline: ${ticket.employee_deadline}`);
        console.log(`- Original sla_deadline: ${ticket.sla_deadline}`);
        
        if (new Date(ticket.employee_deadline).getTime() !== new Date(ticket.sla_deadline).getTime()) {
            throw new Error("Initial employee_deadline and sla_deadline do not match!");
        }
        console.log("- PASS: Initial deadlines match.");

        // 4. Try updating deadline without a reason
        console.log("\n4. Verifying that updating deadline without a reason fails...");
        const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        try {
            await axios.put(`${API}/tickets/${ticketId}/status`, {
                status: 'open',
                sla_deadline: dayAfterTomorrow.toISOString(),
                current_user_id: itAdmin.id
                // Missing reason
            });
            throw new Error("Updating deadline without reason succeeded but should have failed!");
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log("- PASS: Blocked update without reason (Status 400). Response:", err.response.data);
            } else {
                throw err;
            }
        }

        // 5. Try updating deadline by unauthorized user (employee)
        console.log("\n5. Verifying that unauthorized user cannot change deadline...");
        try {
            await axios.put(`${API}/tickets/${ticketId}/status`, {
                status: 'open',
                sla_deadline: dayAfterTomorrow.toISOString(),
                reason: 'I want it faster',
                current_user_id: employee.id
            });
            throw new Error("Unauthorized user succeeded in changing deadline but should have failed!");
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log("- PASS: Blocked unauthorized deadline update (Status 403). Response:", err.response.data);
            } else {
                throw err;
            }
        }

        // 6. Extend deadline (First Extension) by IT Admin
        console.log("\n6. Extending deadline by IT Admin...");
        const extensionDate1 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        extensionDate1.setMilliseconds(0);
        const reason1 = 'Waiting for laptop diagnostic software scans';

        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'open',
            sla_deadline: extensionDate1.toISOString(),
            reason: reason1,
            current_user_id: itAdmin.id
        });
        console.log("- First extension saved successfully.");

        // 7. Verify first extension
        console.log("\n7. Verifying first extension records...");
        detailsRes = await axios.get(`${API}/tickets/${ticketId}/details`);
        let { ticket: ticket1, deadlineHistory: history1 } = detailsRes.data;

        console.log(`- Extended sla_deadline: ${ticket1.sla_deadline}`);
        console.log(`- Extended employee_deadline (should be unchanged): ${ticket1.employee_deadline}`);
        console.log(`- Extended By: ${ticket1.extended_by_name} (${ticket1.extended_by_role})`);
        console.log(`- Extension Reason: ${ticket1.extension_reason}`);
        console.log(`- Extension History length: ${history1.length}`);

        if (new Date(ticket1.employee_deadline).getTime() === new Date(ticket1.sla_deadline).getTime()) {
            throw new Error("employee_deadline and sla_deadline should be different now!");
        }
        if (history1.length !== 1) {
            throw new Error(`Expected 1 history log, got ${history1.length}`);
        }
        if (history1[0].reason !== reason1) {
            throw new Error(`Expected history reason to be '${reason1}', got '${history1[0].reason}'`);
        }
        console.log("- PASS: First extension verified.");

        // 8. Assign ticket to IT Staff and perform Second Extension by Assignee
        console.log(`\n8. Assigning ticket to ${itStaff.full_name} and performing second extension by Assignee...`);
        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'assigned',
            assigned_to_id: itStaff.id,
            current_user_id: itAdmin.id
        });

        const extensionDate2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        extensionDate2.setMilliseconds(0);
        const reason2 = 'Need replacement parts for RAM upgrade';

        await axios.put(`${API}/tickets/${ticketId}/status`, {
            status: 'assigned',
            sla_deadline: extensionDate2.toISOString(),
            reason: reason2,
            current_user_id: itStaff.id
        });
        console.log("- Second extension saved successfully.");

        // 9. Verify second extension and full history timeline
        console.log("\n9. Fetching final details to verify chronological timeline history...");
        detailsRes = await axios.get(`${API}/tickets/${ticketId}/details`);
        let { ticket: ticket2, deadlineHistory: history2 } = detailsRes.data;

        console.log(`- Current sla_deadline: ${ticket2.sla_deadline}`);
        console.log(`- Original employee_deadline: ${ticket2.employee_deadline}`);
        console.log(`- Latest Extended By: ${ticket2.extended_by_name} (${ticket2.extended_by_role})`);
        console.log(`- Latest Extension Reason: ${ticket2.extension_reason}`);
        console.log(`- Total Extensions logged: ${history2.length}`);

        if (history2.length !== 2) {
            throw new Error(`Expected 2 history logs, got ${history2.length}`);
        }

        // Verify ordering is chronological
        console.log("- Chronological History Details:");
        history2.forEach((h, idx) => {
            console.log(`  [Extension #${idx+1}] Old: ${h.old_deadline} -> New: ${h.new_deadline} | Reason: ${h.reason} | By: ${h.updated_by_name} (${h.updated_by_role})`);
        });

        if (history2[0].reason !== reason1 || history2[1].reason !== reason2) {
            throw new Error("History entries are not in chronological order or contain incorrect reasons!");
        }

        console.log("\n=== ALL DEADLINE HISTORY TESTS PASSED SUCCESSFULLY ===");
    } catch (err) {
        console.error("Deadline history test failed:", err.message);
        if (err.response) {
            console.error("Response error data:", err.response.data);
        }
        process.exit(1);
    }
}

runTest();
