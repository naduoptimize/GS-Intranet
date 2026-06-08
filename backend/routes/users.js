const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users with subsidiary info
router.get('/', async (req, res) => {
    const { subsidiaryId } = req.query;
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, u.date_of_birth, u.nic_number, u.employee_no, u.is_synced, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE
        `;
        let params = [];

        if (subsidiaryId) {
            query += ' AND u.subsidiary_id = ?';
            params = [subsidiaryId];
        }

        query += ' ORDER BY u.full_name ASC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users whose birthday is today
router.get('/birthdays', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.profile_pic, u.subsidiary_id, u.date_of_birth, s.name as subsidiary_name,
                   (YEAR(CURDATE()) - YEAR(u.date_of_birth)) AS age
            FROM users u
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
            WHERE u.is_active = TRUE 
              AND u.date_of_birth IS NOT NULL
              AND MONTH(u.date_of_birth) = MONTH(CURDATE())
              AND DAY(u.date_of_birth) = DAY(CURDATE())
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const axios = require('axios');

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !tenantId || !clientSecret) {
        throw new Error('Microsoft Graph API is not configured. Please check your .env file.');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', clientId);
    tokenParams.append('scope', 'https://graph.microsoft.com/.default');
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('grant_type', 'client_credentials');

    console.log('Fetching fresh Microsoft Graph API access token...');
    const tokenRes = await axios.post(tokenUrl, tokenParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    cachedToken = tokenRes.data.access_token;
    const expiresSeconds = tokenRes.data.expires_in || 3600;
    tokenExpiry = Date.now() + (expiresSeconds - 300) * 1000;
    return cachedToken;
}

// Helper to normalize and consolidate company names from Active Directory department field
function normalizeCompany(dept) {
    if (!dept) return 'GEORGE STEUART GROUP';
    
    let cleaned = dept.trim();
    const lower = cleaned.toLowerCase();
    
    if (lower.includes('travel')) {
        return 'GEORGE STEUART TRAVELS (PVT) LTD';
    }
    if (lower.includes('insurance')) {
        return 'GEORGE STEUART INSURANCE BROKERS (PVT) LTD';
    }
    if (lower.includes('& company') || lower.includes('& co.') || lower.includes('& co ')) {
        return 'GEORGE STEUART & COMPANY LTD';
    }
    if (lower.includes('aviation')) {
        return 'GEORGE STEUART AVIATION (PVT) LTD';
    }
    if (lower.includes('tea')) {
        return 'GEORGE STEUART TEAS (PVT) LTD';
    }
    if (lower.includes('health')) {
        return 'GEORGE STEUART HEALTH (PVT) LTD';
    }
    if (lower.includes('investments')) {
        return 'GEORGE STEUART INVESTMENTS (PVT) LTD';
    }
    if (lower.includes('recruitment')) {
        return 'GEORGE STEUART RECRUITMENT (PVT) LTD';
    }
    if (lower.includes('solutions')) {
        return 'GEORGE STEUART SOLUTIONS (PVT) LTD';
    }
    if (lower.includes('optimize')) {
        return 'GEORGE STEUART OPTIMIZE (PVT) LTD';
    }
    
    return cleaned.toUpperCase();
}

// Get Manually Added Users from local database
router.get('/manual', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE AND (u.is_synced = FALSE OR u.is_synced IS NULL)
            ORDER BY u.full_name ASC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching manually added directory from database' });
    }
});

// Get Microsoft Office 365 Users from local database
router.get('/office365', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, COALESCE(u.o365_company, s.name) as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE AND u.is_synced = TRUE
            ORDER BY u.full_name ASC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching office365 directory from database' });
    }
});

// Sync Microsoft Office 365 Users to local database
router.post('/office365/sync', async (req, res) => {
    try {
        // 1. Get Access Token
        const accessToken = await getAccessToken();

        // 2. Fetch all Graph Users
        console.log('Sync: Querying Graph API users...');
        let graphUsers = [];
        let nextLink = `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,mobilePhone,businessPhones,companyName&$top=999`;

        while (nextLink) {
            const usersRes = await axios.get(nextLink, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
            const pageUsers = usersRes.data.value || [];
            graphUsers = graphUsers.concat(pageUsers);
            nextLink = usersRes.data['@odata.nextLink'] || null;
        }

        console.log(`Sync: Retrieved ${graphUsers.length} users from Graph API.`);

        // 3. Sync subsidiaries table
        // Find distinct normalized company names from incoming Graph users
        const distinctCompanies = [...new Set(graphUsers.map(u => normalizeCompany(u.department)).filter(Boolean))];
        console.log(`Sync: Found ${distinctCompanies.length} distinct companies in M365 payload.`);

        // Load existing subsidiaries
        const [existingSubs] = await db.execute("SELECT id, name FROM subsidiaries");
        const subMapByName = new Map(existingSubs.map(s => [s.name.trim().toLowerCase(), s.id]));

        // Process distinct companies: insert if not present
        for (const companyName of distinctCompanies) {
            const compKey = companyName.trim().toLowerCase();
            if (!subMapByName.has(compKey)) {
                console.log(`Sync: Inserting new subsidiary: "${companyName}"`);
                const [insSub] = await db.execute(
                    `INSERT INTO subsidiaries 
                     (name, description, mission, vision, location, website, email, phone, employees) 
                     VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0)`,
                    [companyName]
                );
                subMapByName.set(compKey, insSub.insertId);
            }
        }

        // 4. Load existing database users
        const [dbUsers] = await db.execute("SELECT id, email, is_synced, ignore_sync, is_active FROM users");
        const dbUserMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]));

        // Hash default password for new entries
        const defaultPasswordHash = await bcrypt.hash('GS@2026', 10);
        const apiEmails = new Set();

        // 5. Process each Graph user
        for (const u of graphUsers) {
            const email = (u.mail || u.userPrincipalName || '').trim().toLowerCase();
            if (!email || email === 'n/a') continue;

            apiEmails.add(email);

            const phoneVal = u.mobilePhone || (Array.isArray(u.businessPhones) && u.businessPhones[0]) || 'N/A';
            const normalizedSubName = normalizeCompany(u.department);
            
            // Map subsidiary_id dynamically to the matched database ID
            const subId = subMapByName.get(normalizedSubName.trim().toLowerCase()) || null;
            
            const deptVal = u.companyName ? u.companyName.trim() : 'Office 365';
            const jobVal = u.jobTitle || 'O365 Account';
            const fullName = u.displayName || 'Unnamed User';

            if (dbUserMap.has(email)) {
                // Update existing user
                const existing = dbUserMap.get(email);
                await db.execute(
                    `UPDATE users 
                     SET full_name = ?, phone = ?, subsidiary_id = ?, o365_company = ?, department = ?, job_title = ?, is_active = TRUE, is_synced = TRUE 
                     WHERE id = ?`,
                    [fullName, phoneVal, subId, normalizedSubName, deptVal, jobVal, existing.id]
                );
            } else {
                // Insert new user (default role: 'employee')
                await db.execute(
                    `INSERT INTO users 
                     (full_name, email, password, role, subsidiary_id, o365_company, department, job_title, phone, is_active, is_synced, ignore_sync, needs_password_change) 
                     VALUES (?, ?, ?, 'employee', ?, ?, ?, ?, ?, TRUE, TRUE, FALSE, TRUE)`,
                    [fullName, email, defaultPasswordHash, subId, normalizedSubName, deptVal, jobVal, phoneVal]
                );
            }
        }

        // 6. Deactivate database users that are marked as synced but NOT in the API response
        // and ignore_sync is FALSE
        let deactivatedCount = 0;
        for (const dbUser of dbUsers) {
            const dbEmailLower = dbUser.email.toLowerCase();
            if (dbUser.is_synced && !dbUser.ignore_sync && !apiEmails.has(dbEmailLower)) {
                if (dbUser.is_active) {
                    await db.execute("UPDATE users SET is_active = FALSE WHERE id = ?", [dbUser.id]);
                    deactivatedCount++;
                }
            }
        }

        // 7. Update employee count in subsidiaries table for all active users
        const [updatedSubs] = await db.execute("SELECT id FROM subsidiaries");
        for (const s of updatedSubs) {
            const [countRes] = await db.execute("SELECT COUNT(*) as count FROM users WHERE subsidiary_id = ? AND is_active = TRUE", [s.id]);
            await db.execute("UPDATE subsidiaries SET employees = ? WHERE id = ?", [countRes[0].count, s.id]);
        }

        res.json({
            success: true,
            message: `Synchronization successful! Synced ${graphUsers.length} profiles. Deactivated ${deactivatedCount} unmatched profiles. Subsidiaries updated dynamically.`,
            apiCount: graphUsers.length,
            deactivatedCount: deactivatedCount
        });

    } catch (err) {
        console.error('Sync Error:', err);
        res.status(500).json({ message: 'Failed to synchronize with Office 365 API', error: err.message });
    }
});

// Get unmatched/inactive M365 users
router.get('/office365/unmatched', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, COALESCE(u.o365_company, s.name) as subsidiary_name 
            FROM users u
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
            WHERE u.is_synced = TRUE AND u.is_active = FALSE
            ORDER BY u.full_name ASC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching unmatched profiles' });
    }
});

// Activate a user and set ignore_sync to TRUE
router.patch('/office365/activate/:id', async (req, res) => {
    try {
        await db.execute(
            "UPDATE users SET is_active = TRUE, ignore_sync = TRUE WHERE id = ?",
            [req.params.id]
        );
        res.json({ success: true, message: 'Profile activated and marked to ignore future deactivations.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to activate profile' });
    }
});

// Hard delete an Office 365 user from database
router.delete('/office365/hard-delete/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Profile deleted successfully from database.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete profile' });
    }
});

// Search active users
router.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
        const query = `
            SELECT id, full_name, email, job_title, profile_pic, is_synced
            FROM users
            WHERE is_active = TRUE AND (full_name LIKE ? OR email LIKE ?)
            LIMIT 20
        `;
        const searchPattern = `%${q || ''}%`;
        const [rows] = await db.execute(query, [searchPattern, searchPattern]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Proxy route to fetch O365 profile photos
router.get('/office365/photo/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const token = await getAccessToken();
        const response = await axios.get(
            `https://graph.microsoft.com/v1.0/users/${email}/photo/$value`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            }
        );
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(response.data);
    } catch (err) {
        // Fallback: Check if user exists to redirect to ui-avatars.com using name, or just use email
        try {
            const [rows] = await db.execute('SELECT full_name FROM users WHERE email = ?', [email]);
            const name = rows.length > 0 ? rows[0].full_name : email;
            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=475569&bold=true&size=128`;
            return res.redirect(fallbackUrl);
        } catch (dbErr) {
            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=f1f5f9&color=475569&bold=true&size=128`;
            return res.redirect(fallbackUrl);
        }
    }
});

// Get a single user's detailed info
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, u.date_of_birth, u.nic_number, u.employee_no, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a new user
router.post('/', async (req, res) => {
    const { 
        full_name, 
        email, 
        password, 
        role, 
        subsidiary_id, 
        department, 
        job_title, 
        phone, 
        nic_number, 
        employee_no, 
        date_of_birth 
    } = req.body;
    
    try {
        // Check if user already exists
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title, phone, nic_number, employee_no, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                full_name || null, 
                email || null, 
                hashedPassword, 
                role || 'employee', 
                subsidiary_id && subsidiary_id !== '' ? subsidiary_id : null, 
                department || null, 
                job_title || null, 
                phone || null, 
                nic_number || null, 
                employee_no || null, 
                date_of_birth && date_of_birth !== '' ? date_of_birth : null
            ]
        );

        res.status(201).json({ id: result.insertId, message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update own profile details (for standard employee self-service)
router.put('/profile/:id', async (req, res) => {
    const { full_name, email, phone, bio, profile_pic, job_title } = req.body;
    try {
        await db.execute(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, bio = ?, profile_pic = ?, job_title = ? WHERE id = ?',
            [full_name, email, phone, bio, profile_pic || null, job_title || 'Employee', req.params.id]
        );
        
        // Fetch the updated user details so we can return them to the frontend to refresh state
        const [updatedRows] = await db.execute(`
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.id = ?
        `, [req.params.id]);

        res.json({ 
            message: 'Profile updated successfully',
            user: updatedRows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update profile details' });
    }
});

// Update a user (admin)
router.put('/:id', async (req, res) => {
    const { full_name, email, role, subsidiary_id, department, job_title, phone, date_of_birth, nic_number, employee_no } = req.body;
    try {
        await db.execute(
            'UPDATE users SET full_name=?, email=?, role=?, subsidiary_id=?, department=?, job_title=?, phone=?, date_of_birth=?, nic_number=?, employee_no=? WHERE id=?',
            [full_name, email, role, subsidiary_id || null, department, job_title, phone, date_of_birth || null, nic_number || null, employee_no || null, req.params.id]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Deactivate (soft delete) a user
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password (admin sets temp password)
router.patch('/:id/reset-password', async (req, res) => {
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword || 'GS@2026', 10);
        await db.execute(
            'UPDATE users SET password=?, needs_password_change=TRUE WHERE id=?',
            [hashedPassword, req.params.id]
        );
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

