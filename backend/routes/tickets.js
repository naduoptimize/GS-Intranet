const express = require('express');
const router = express.Router();
const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper: Get tickets based on user role and query filters
async function fetchTicketsWithAccessControl(req, queryParams) {
    const { userId, role, department: userDept } = req.query;
    const { status, department, category, priority, assigned_to_id } = queryParams;

    let query = `
        SELECT t.*, u.full_name, u.email as user_email, u.department as user_department, 
               u.job_title, u.employee_no, s.name as subsidiary_name,
               assignee.full_name as assignee_name, assignee.email as assignee_email
        FROM tickets t 
        JOIN users u ON t.user_id = u.id 
        LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
        LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
    `;
    const params = [];
    const conditions = [];

    // Role-based Access Scoping
    if (role === 'employee') {
        conditions.push('t.user_id = ?');
        params.push(userId);
    } else if (role === 'it_staff') {
        conditions.push('t.department = "it"');
        conditions.push('t.assigned_to_id = ?');
        params.push(userId);
    } else if (role === 'hr_staff') {
        conditions.push('t.department = "hr"');
        conditions.push('t.assigned_to_id = ?');
        params.push(userId);
    } else if (role === 'it_admin') {
        conditions.push('t.department = "it"');
    } else if (role === 'hr_admin') {
        conditions.push('t.department = "hr"');
    } else if (role === 'sub_admin') {
        // Sub-admins can only see tickets from their own subsidiary
        // First, look up the sub_admin's subsidiary_id from the DB
        const [adminRows] = await db.execute(
            'SELECT subsidiary_id, department FROM users WHERE id = ?',
            [userId]
        );
        if (adminRows.length > 0 && adminRows[0].subsidiary_id) {
            conditions.push('u.subsidiary_id = ?');
            params.push(adminRows[0].subsidiary_id);
        }
        // Also scope by department if it maps to a ticketing dept
        const deptLower = (adminRows[0]?.department || userDept || '').toLowerCase();
        if (deptLower === 'it' || deptLower === 'hr') {
            conditions.push('t.department = ?');
            params.push(deptLower);
        }
    } // 'super_admin' has no conditions (full access)

    // Applied Filters
    if (status && status !== 'all') {
        conditions.push('t.status = ?');
        params.push(status);
    }
    if (department && department !== 'all') {
        conditions.push('t.department = ?');
        params.push(department);
    }
    if (category && category !== 'all') {
        conditions.push('t.category = ?');
        params.push(category);
    }
    if (priority && priority !== 'all') {
        conditions.push('t.priority = ?');
        params.push(priority);
    }
    if (assigned_to_id && assigned_to_id !== 'all') {
        if (assigned_to_id === 'unassigned') {
            conditions.push('t.assigned_to_id IS NULL');
        } else {
            conditions.push('t.assigned_to_id = ?');
            params.push(assigned_to_id);
        }
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
}

// Helper: Log ticket activity in audit trail
async function logActivity(ticketId, userId, action, details) {
    try {
        await db.execute(
            'INSERT INTO ticket_audit_logs (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)',
            [ticketId, userId, action, details]
        );
    } catch (err) {
        console.error("Activity logging error:", err);
    }
}

// Helper: Socket notification helper
function notifySocketRoom(req, room, event, data) {
    const io = req.app.get('io');
    if (io) {
        io.to(room).emit(event, data);
    }
}

// --- CORE ROUTES ---

// Get tickets (Access controlled)
router.get('/', async (req, res) => {
    try {
        const rows = await fetchTicketsWithAccessControl(req, req.query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee's personal tickets
router.get('/my-tickets', async (req, res) => {
    const { userId } = req.query;
    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const [rows] = await db.execute(
            `SELECT t.*, assignee.full_name as assignee_name 
             FROM tickets t 
             LEFT JOIN users assignee ON t.assigned_to_id = assignee.id 
             WHERE t.user_id = ? 
             ORDER BY t.created_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a new ticket
router.post('/', async (req, res) => {
    const { userId, subject, department, category, priority, description } = req.body;
    try {
        if (!userId || !subject || !department || !category || !priority || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Calculate SLA Deadline in hours based on priority
        let slaHours = 48; // default medium
        if (priority === 'low') slaHours = 72;
        else if (priority === 'high') slaHours = 24;
        else if (priority === 'urgent') slaHours = 4;

        const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

        // Insert ticket
        const [result] = await db.execute(
            `INSERT INTO tickets (user_id, subject, department, category, priority, description, status, sla_deadline) 
             VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
            [userId, subject, department, category, priority, description, slaDeadline]
        );

        const ticketId = result.insertId;
        const ticketNo = `TIC-${String(ticketId).padStart(4, '0')}`;

        // Update ticket number
        await db.execute('UPDATE tickets SET ticket_no = ? WHERE id = ?', [ticketNo, ticketId]);

        // Audit Trail
        await logActivity(ticketId, userId, 'create', 'Ticket submitted by employee');

        // Socket Notifications: notify department admins and super admins
        const newTicketData = { id: ticketId, ticket_no: ticketNo, subject, department, priority };
        notifySocketRoom(req, `dept:${department}`, 'ticket_created', newTicketData);
        notifySocketRoom(req, 'role:super_admin', 'ticket_created', newTicketData);

        // Create database notifications for all department admins
        const [deptAdmins] = await db.execute(
            'SELECT id FROM users WHERE role = ? OR (role = "sub_admin" AND department = ?)', 
            [`${department}_admin`, department]
        );
        for (const admin of deptAdmins) {
            await db.execute(
                'INSERT INTO notifications (user_id, type, message, link) VALUES (?, "ticket", ?, ?)',
                [admin.id, `New ticket ${ticketNo} created in ${department.toUpperCase()} department.`, `/admin/tickets`]
            );
        }

        res.status(201).json({ 
            id: ticketId, 
            ticket_no: ticketNo,
            message: 'Your service request has been registered successfully.' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get detailed ticket page (ticket, comments, attachments, logs)
router.get('/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        // Ticket detail
        const [tickets] = await db.execute(
            `SELECT t.*, u.full_name, u.email as user_email, u.department as user_department, 
                   u.job_title, u.employee_no, s.name as subsidiary_name,
                   assignee.full_name as assignee_name, assignee.email as assignee_email
             FROM tickets t 
             JOIN users u ON t.user_id = u.id 
             LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
             LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
             WHERE t.id = ?`,
            [id]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Comments
        const [comments] = await db.execute(
            `SELECT tc.*, u.full_name, u.profile_pic, u.role
             FROM ticket_comments tc
             JOIN users u ON tc.user_id = u.id
             WHERE tc.ticket_id = ?
             ORDER BY tc.created_at ASC`,
            [id]
        );

        // Attachments
        const [attachments] = await db.execute(
            `SELECT ta.*, u.full_name
             FROM ticket_attachments ta
             JOIN users u ON ta.uploaded_by = u.id
             WHERE ta.ticket_id = ?
             ORDER BY ta.created_at DESC`,
            [id]
        );

        // Audit Trail
        const [logs] = await db.execute(
            `SELECT tal.*, u.full_name
             FROM ticket_audit_logs tal
             JOIN users u ON tal.user_id = u.id
             WHERE tal.ticket_id = ?
             ORDER BY tal.created_at DESC`,
            [id]
        );

        // Internal Notes (staff-only)
        const [internalNotes] = await db.execute(
            `SELECT tin.*, u.full_name, u.role
             FROM ticket_internal_notes tin
             JOIN users u ON tin.user_id = u.id
             WHERE tin.ticket_id = ?
             ORDER BY tin.created_at ASC`,
            [id]
        );

        res.json({ ticket, comments, attachments, logs, internalNotes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update ticket status and assignment (Support Admins / Super Admins / Assigned Staff)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to_id, resolution_notes, current_user_id } = req.body;
    
    try {
        const [existing] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const ticket = existing[0];

        let query = 'UPDATE tickets SET status = ?';
        const params = [status];
        let auditDetails = `Status updated to ${status}`;

        // Priority change
        const { priority } = req.body;
        if (priority) {
            query += ', priority = ?';
            params.push(priority);
            auditDetails += `, priority changed to ${priority}`;
        }

        // Assignment logic
        if (assigned_to_id !== undefined) {
            query += ', assigned_to_id = ?';
            params.push(assigned_to_id || null);

            if (assigned_to_id) {
                const [staff] = await db.execute('SELECT full_name, email FROM users WHERE id = ?', [assigned_to_id]);
                if (staff.length > 0) {
                    query += ', assigned_to = ?, assigned_email = ?';
                    params.push(staff[0].full_name, staff[0].email);
                    auditDetails += `, assigned to ${staff[0].full_name}`;
                }
            } else {
                query += ', assigned_to = "Unassigned", assigned_email = "-"';
                auditDetails += `, assignment cleared`;
            }
        }

        // Resolution notes and resolution date logic
        if (resolution_notes !== undefined) {
            query += ', resolution_notes = ?';
            params.push(resolution_notes);
            auditDetails += ` with notes: "${resolution_notes}"`;
        }

        if (status === 'resolved') {
            query += ', resolution_date = CURRENT_TIMESTAMP';
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.execute(query, params);

        // Audit Logging
        const userIdForLog = current_user_id || ticket.user_id;
        await logActivity(id, userIdForLog, status === 'resolved' ? 'resolve' : 'update_status', auditDetails);

        // Socket Notification: to user and department
        notifySocketRoom(req, `user:${ticket.user_id}`, 'ticket_updated', { id, status, details: auditDetails });
        notifySocketRoom(req, `dept:${ticket.department}`, 'ticket_updated', { id, status, details: auditDetails });

        // Database Notification to requester
        await db.execute(
            'INSERT INTO notifications (user_id, type, message, link) VALUES (?, "ticket", ?, ?)',
            [
                ticket.user_id, 
                `Your ticket ${ticket.ticket_no || `#${id}`} status was updated to ${status.toUpperCase()}.`, 
                `/help`
            ]
        );

        // Notification to assigned staff if assigned
        if (assigned_to_id) {
            await db.execute(
                'INSERT INTO notifications (user_id, type, message, link) VALUES (?, "ticket", ?, ?)',
                [
                    assigned_to_id, 
                    `Ticket ${ticket.ticket_no || `#${id}`} has been assigned to you.`, 
                    `/help`
                ]
            );
            notifySocketRoom(req, `user:${assigned_to_id}`, 'ticket_assigned', { id, ticket_no: ticket.ticket_no });
        }

        res.json({ message: 'Ticket updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Post an internal note (staff-only, not visible to requester)
router.post('/:id/internal-notes', async (req, res) => {
    const { id } = req.params;
    const { userId, note } = req.body;
    try {
        if (!userId || !note) {
            return res.status(400).json({ message: 'User ID and note are required' });
        }
        await db.execute(
            'INSERT INTO ticket_internal_notes (ticket_id, user_id, note) VALUES (?, ?, ?)',
            [id, userId, note]
        );
        await logActivity(id, userId, 'internal_note', 'Added internal note');
        res.status(201).json({ message: 'Internal note added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Post a comment
router.post('/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { userId, comment } = req.body;
    try {
        if (!userId || !comment) {
            return res.status(400).json({ message: 'User ID and comment text are required' });
        }

        await db.execute(
            'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
            [id, userId, comment]
        );

        await logActivity(id, userId, 'comment', 'Added comment');

        const [userRows] = await db.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
        const userName = userRows[0]?.full_name || 'Someone';

        // Emit Socket event to rooms
        const [ticketRows] = await db.execute('SELECT user_id, assigned_to_id FROM tickets WHERE id = ?', [id]);
        if (ticketRows.length > 0) {
            const ticket = ticketRows[0];
            const payload = { ticketId: id, userName, comment };
            notifySocketRoom(req, `user:${ticket.user_id}`, 'comment_added', payload);
            if (ticket.assigned_to_id) {
                notifySocketRoom(req, `user:${ticket.assigned_to_id}`, 'comment_added', payload);
            }
        }

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload attachment association
router.post('/:id/attachments', async (req, res) => {
    const { id } = req.params;
    const { fileName, fileUrl, uploadedBy } = req.body;
    try {
        if (!fileName || !fileUrl || !uploadedBy) {
            return res.status(400).json({ message: 'fileName, fileUrl, and uploadedBy are required' });
        }

        await db.execute(
            'INSERT INTO ticket_attachments (ticket_id, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?)',
            [id, fileName, fileUrl, uploadedBy]
        );

        await logActivity(id, uploadedBy, 'attachment', `Uploaded file: ${fileName}`);

        res.status(201).json({ message: 'Attachment associated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Rate and Close Ticket
router.put('/:id/rate', async (req, res) => {
    const { id } = req.params;
    const { rating, feedback, userId } = req.body;
    try {
        if (!rating) {
            return res.status(400).json({ message: 'Rating is required' });
        }

        await db.execute(
            'UPDATE tickets SET status = "closed", rating = ?, feedback = ?, resolution_date = COALESCE(resolution_date, CURRENT_TIMESTAMP) WHERE id = ?',
            [rating, feedback || null, id]
        );

        await logActivity(id, userId, 'rate_and_close', `Ticket closed with feedback. Rating: ${rating}/5`);

        // Notify admins
        const [ticketRows] = await db.execute('SELECT department, ticket_no FROM tickets WHERE id = ?', [id]);
        if (ticketRows.length > 0) {
            const ticket = ticketRows[0];
            notifySocketRoom(req, `dept:${ticket.department}`, 'ticket_closed', { id, ticket_no: ticket.ticket_no });
        }

        res.json({ message: 'Satisfaction feedback received. Ticket closed.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete ticket
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM tickets WHERE id = ?', [id]);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- EXPORTS ---

// Excel Export
router.get('/export/excel', async (req, res) => {
    try {
        const tickets = await fetchTicketsWithAccessControl(req, req.query);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('GS Tickets Export');

        worksheet.columns = [
            { header: 'Ticket Number', key: 'ticket_no', width: 15 },
            { header: 'Subject', key: 'subject', width: 30 },
            { header: 'Department', key: 'department', width: 12 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Priority', key: 'priority', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Requester Name', key: 'full_name', width: 25 },
            { header: 'Assigned Specialist', key: 'assignee_name', width: 25 },
            { header: 'SLA Deadline', key: 'sla_deadline', width: 22 },
            { header: 'Created Date', key: 'created_at', width: 22 },
            { header: 'Resolution Date', key: 'resolution_date', width: 22 },
            { header: 'Rating (1-5)', key: 'rating', width: 12 }
        ];

        // Format and add rows
        tickets.forEach(t => {
            worksheet.addRow({
                ticket_no: t.ticket_no || `#TKT-${t.id}`,
                subject: t.subject,
                department: String(t.department).toUpperCase(),
                category: t.category,
                priority: String(t.priority).toUpperCase(),
                status: String(t.status).toUpperCase(),
                full_name: t.full_name,
                assignee_name: t.assignee_name || 'Unassigned',
                sla_deadline: t.sla_deadline ? new Date(t.sla_deadline).toLocaleString() : 'N/A',
                created_at: new Date(t.created_at).toLocaleString(),
                resolution_date: t.resolution_date ? new Date(t.resolution_date).toLocaleString() : 'Pending',
                rating: t.rating || 'N/A'
            });
        });

        // Styling headers
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C8102E' } // Classic Crimson
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=gs_tickets_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Excel export error:", err);
        res.status(500).json({ message: 'Excel generation error' });
    }
});

// PDF Export
router.get('/export/pdf', async (req, res) => {
    try {
        const tickets = await fetchTicketsWithAccessControl(req, req.query);
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=gs_tickets_report.pdf');
        doc.pipe(res);

        // Logo text
        doc.fillColor('#C8102E').fontSize(24).font('Helvetica-Bold').text('GEORGE STEUART', { align: 'center' });
        doc.fillColor('#475569').fontSize(12).font('Helvetica-Bold').text('Corporate Intranet Central Support Desk Report', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Header line
        doc.moveTo(30, 90).lineTo(565, 90).strokeColor('#E2E8F0').stroke();
        doc.moveDown(1.5);

        tickets.forEach((t, i) => {
            // Check if page needs break
            if (doc.y > 700) doc.addPage();

            // Card container
            doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold')
                .text(`${t.ticket_no || `#TKT-${t.id}`} : ${t.subject}`);
            
            doc.fontSize(9).font('Helvetica');
            
            doc.fillColor('#475569')
                .text(`Dept: ${String(t.department).toUpperCase()}  |  Category: ${t.category}  |  Priority: ${String(t.priority).toUpperCase()}  |  Status: ${String(t.status).toUpperCase()}`);
            
            doc.text(`Requester: ${t.full_name} (${t.subsidiary_name || 'GS Group'})  |  Specialist: ${t.assignee_name || 'Unassigned'}`);
            
            doc.text(`Created: ${new Date(t.created_at).toLocaleString()}  |  Deadline: ${t.sla_deadline ? new Date(t.sla_deadline).toLocaleString() : 'N/A'}`);
            
            if (t.status === 'resolved' || t.status === 'closed') {
                doc.fillColor('#15803D')
                    .text(`Resolved: ${t.resolution_date ? new Date(t.resolution_date).toLocaleString() : 'Yes'}  |  Rating: ${t.rating ? `${t.rating}/5` : 'N/A'}`);
                if (t.resolution_notes) {
                    doc.fillColor('#475569').text(`Notes: ${t.resolution_notes}`);
                }
            }
            doc.moveDown(0.8);
            doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#F1F5F9').stroke();
            doc.moveDown(0.8);
        });

        doc.end();
    } catch (err) {
        console.error("PDF export error:", err);
        res.status(500).json({ message: 'PDF generation error' });
    }
});

// --- ANALYTICS ROUTE ---

// Ticketing summary analytics
router.get('/analytics/summary', async (req, res) => {
    const { department } = req.query;
    try {
        const params = [];
        let deptCondition = '';
        if (department && department !== 'all') {
            deptCondition = 'AND department = ?';
            params.push(department);
        }

        // Summary counts
        const [summaryRows] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN sla_deadline < NOW() AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as sla_violations
            FROM tickets
            WHERE 1=1 ${deptCondition}
        `, params);

        const summary = summaryRows[0];

        // Breakdown by priority
        const [priorityRows] = await db.execute(`
            SELECT priority, COUNT(*) as count
            FROM tickets
            WHERE 1=1 ${deptCondition}
            GROUP BY priority
        `, params);

        // Breakdown by department
        const [deptRows] = await db.execute(`
            SELECT department, COUNT(*) as count
            FROM tickets
            GROUP BY department
        `);

        // Breakdown by status
        const [statusRows] = await db.execute(`
            SELECT status, COUNT(*) as count
            FROM tickets
            WHERE 1=1 ${deptCondition}
            GROUP BY status
        `, params);

        // Monthly trends (last 6 months)
        const [trendRows] = await db.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%b %Y') as month,
                COUNT(*) as count
            FROM tickets
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) ${deptCondition}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
            ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
        `, params);

        // Staff workload (Department level)
        let staffParams = [];
        let staffCondition = 'WHERE u.role IN ("it_staff", "hr_staff", "it_admin", "hr_admin")';
        if (department && department !== 'all') {
            staffCondition = 'WHERE (u.role = ? OR u.department = ?)';
            staffParams.push(`${department}_staff`, department);
        }
        const [staffRows] = await db.execute(`
            SELECT u.id, u.full_name, u.role, u.department,
                   SUM(CASE WHEN t.status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) as active_tickets,
                   SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_tickets
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to_id
            ${staffCondition}
            GROUP BY u.id
            ORDER BY active_tickets DESC
        `, staffParams);

        // SLA Compliance rate (Resolved/Closed tickets completed before deadline)
        let complianceParams = [...params];
        const [slaComplianceRows] = await db.execute(`
            SELECT 
                COUNT(*) as total_resolved,
                SUM(CASE WHEN resolution_date <= sla_deadline THEN 1 ELSE 0 END) as complied
            FROM tickets
            WHERE status IN ('resolved', 'closed') ${deptCondition}
        `, complianceParams);
        
        let slaCompliance = 100;
        const totalResolved = slaComplianceRows[0]?.total_resolved || 0;
        const complied = slaComplianceRows[0]?.complied || 0;
        if (totalResolved > 0) {
            slaCompliance = Math.round((complied / totalResolved) * 100);
        }

        // Average resolution time in hours
        const [avgTimeRows] = await db.execute(`
            SELECT 
                AVG(TIMESTAMPDIFF(HOUR, created_at, resolution_date)) as avg_hours
            FROM tickets
            WHERE status IN ('resolved', 'closed') AND resolution_date IS NOT NULL ${deptCondition}
        `, complianceParams);

        const avgResolutionTimeHours = Math.round(avgTimeRows[0]?.avg_hours || 0);

        res.json({
            summary: {
                total: summary.total || 0,
                open: summary.open || 0,
                pending: summary.pending || 0,
                inProgress: summary.in_progress || 0,
                resolved: summary.resolved || 0,
                closed: summary.closed || 0,
                critical: summary.critical || 0,
                slaViolations: summary.sla_violations || 0,
                slaCompliance,
                avgResolutionTimeHours
            },
            priorities: priorityRows,
            departments: deptRows,
            statuses: statusRows,
            trends: trendRows,
            teamWorkload: staffRows
        });
    } catch (err) {
        console.error("Analytics Summary error:", err);
        res.status(500).json({ message: 'Analytics calculation error' });
    }
});

module.exports = router;
