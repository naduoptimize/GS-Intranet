const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { isSuperOrGroupAdmin, isSubAdmin, normalizeRole } = require('../utils/roles');

// Get all users with subsidiary info
router.get('/', async (req, res) => {
    const { subsidiaryId, role, user_subsidiary_id } = req.query;
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, u.date_of_birth, u.nic_number, u.employee_no, u.is_synced, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE
        `;
        let params = [];

        // If queried by subadmin, enforce their subsidiary
        if (isSubAdmin(role)) {
            const subId = user_subsidiary_id || subsidiaryId;
            if (subId) {
                query += ' AND u.subsidiary_id = ?';
                params.push(subId);
            }
        } else if (subsidiaryId && subsidiaryId !== 'All' && subsidiaryId !== 'all') {
            query += ' AND u.subsidiary_id = ?';
            params.push(subsidiaryId);
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

// Helper to intelligently resolve subsidiary and clean department from Azure AD user data
function resolveSubsidiaryAndDepartment(u, existingSubs) {
    const email = (u.mail || u.userPrincipalName || '').toLowerCase().trim();
    const dept = (u.department || '').trim();
    const company = (u.companyName || '').trim();
    const allText = `${company} ${dept} ${email}`.toLowerCase();

    const findSub = (...keywords) => {
        for (const kw of keywords) {
            const found = existingSubs.find(s => s.name.toLowerCase().includes(kw.toLowerCase()));
            if (found) return found.id;
        }
        return null;
    };

    let subId = null;
    let companyName = company || dept || 'GEORGE STEUART GROUP';

    // 1. Optimize
    if (email.endsWith('@gsoptimize.lk') || allText.includes('optimize')) {
        subId = findSub('optimize');
        companyName = 'GEORGE STEUART OPTIMIZE (PVT) LTD';
    }
    // 2. Seregen
    else if (email.endsWith('@seregen.lk') || allText.includes('seregen')) {
        subId = findSub('seregen') || findSub('consumer');
        companyName = 'SEREGEN (PVT) LTD';
    }
    // 3. Divasa Pharma
    else if (email.endsWith('@divasapharma.lk') || allText.includes('divasa')) {
        subId = findSub('divasa') || findSub('health');
        companyName = 'DIVASA PHARMA LTD';
    }
    // 4. Education
    else if (email.endsWith('@gseducation.lk') || allText.includes('education')) {
        subId = findSub('education');
        companyName = 'GEORGE STEUART EDUCATION (PVT) LTD';
    }
    // 5. Laboratories
    else if (email.endsWith('@gslabs.lk') || allText.includes('laboratories') || allText.includes('labs')) {
        subId = findSub('laboratories', 'labs') || findSub('health');
        companyName = 'GEORGE STEUART LABORATORIES (PVT) LTD';
    }
    // 6. Ethicals
    else if (email.endsWith('@gsethicals.lk') || allText.includes('ethicals')) {
        subId = findSub('ethicals') || findSub('health');
        companyName = 'GEORGE STEUART ETHICALS (PVT) LTD';
    }
    // 7. Health & Pharma
    else if (email.endsWith('@gshealth.lk') || email.endsWith('@gspharma.lk') || allText.includes('health') || allText.includes('pharma')) {
        subId = findSub('health');
        companyName = 'GEORGE STEUART HEALTH (PVT) LTD';
    }
    // 8. Consumer & FMCG
    else if (email.endsWith('@gsconsumer.lk') || email.endsWith('@serinaturals.com') || allText.includes('consumer') || allText.includes('fmcg')) {
        subId = findSub('consumer');
        companyName = 'GEORGE STEUART CONSUMER (PVT) LTD';
    }
    // 9. Steuart Holidays
    else if (email.endsWith('@steuartholidays.com') || allText.includes('holiday')) {
        subId = findSub('holiday') || findSub('travel');
        companyName = 'STEUART HOLIDAYS';
    }
    // 10. Travels
    else if (email.endsWith('@gstravels.lk') || allText.includes('travel')) {
        subId = findSub('travel');
        companyName = 'GEORGE STEUART TRAVELS (PVT) LTD';
    }
    // 11. Insurance
    else if (email.endsWith('@gsinsurance.lk') || allText.includes('insurance')) {
        subId = findSub('insurance brokers', 'insurance');
        companyName = 'GEORGE STEUART INSURANCE BROKERS (PVT) LTD';
    }
    // 12. Heladiv / HVA Foods
    else if (email.endsWith('@heladiv.com') || email.endsWith('@heladiv.lk') || allText.includes('heladiv') || allText.includes('hva foods')) {
        subId = findSub('heladiv', 'hva');
        companyName = 'HVA FOODS PLC';
    }
    // 13. Teas
    else if (email.endsWith('@gsteas.lk') || (allText.includes('tea') && !allText.includes('heladiv'))) {
        subId = findSub('teas', 'tea');
        companyName = 'GEORGE STEUART TEAS (PVT) LTD';
    }
    // 14. Solutions & Engineering
    else if (email.endsWith('@gssolutions.lk') || allText.includes('solutions') || allText.includes('engineering')) {
        subId = findSub('solutions');
        companyName = 'GEORGE STEUART SOLUTIONS (PVT) LTD';
    }
    // 15. Aviation
    else if (email.endsWith('@gsaviation.lk') || allText.includes('aviation')) {
        subId = findSub('aviation');
        companyName = 'GEORGE STEUART AVIATION (PVT) LTD';
    }
    // 16. Recruitment
    else if (email.endsWith('@gsrecruitment.lk') || allText.includes('recruitment')) {
        subId = findSub('recruitment');
        companyName = 'GEORGE STEUART RECRUITMENT (PVT) LTD';
    }
    // 17. Asset Management
    else if (email.endsWith('@gsasset.lk') || email.endsWith('@gsam.lk') || allText.includes('asset management')) {
        subId = findSub('asset');
        companyName = 'GEORGE STEUART ASSET MANAGEMENT (PVT) LTD';
    }
    // 18. Investments
    else if (allText.includes('investments') || allText.includes('invest')) {
        subId = findSub('invest');
        companyName = 'GEORGE STEUART INVESTMENTS (PVT) LTD';
    }
    // 19. Citrus
    else if (email.endsWith('@citrusleisure.com') || allText.includes('citrus')) {
        subId = findSub('citrus');
        companyName = 'CITRUS LEISURE';
    }
    // 20. Holding & Parent Group
    else if (email.endsWith('@georgesteuart.lk') || allText.includes('george steuart &') || allText.includes('george steuart group')) {
        subId = findSub('& co', 'holding', 'company ltd');
        companyName = 'GEORGE STEUART & COMPANY LTD';
    }

    // Dynamic fallback matching against existing subsidiaries
    if (!subId && company) {
        const found = existingSubs.find(s => 
            s.name.toLowerCase().trim() === company.toLowerCase().trim() ||
            company.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(company.toLowerCase())
        );
        if (found) {
            subId = found.id;
            companyName = found.name;
        }
    }

    // Clean department string so it does not repeat company name
    let finalDept = dept || company || 'General';
    const deptLower = finalDept.toLowerCase();
    if (deptLower.includes('(pvt) ltd') || deptLower.includes('ltd') || deptLower.includes('plc') || deptLower === 'office 365' || !dept) {
        if (subId === findSub('optimize')) finalDept = 'Technology & IT Services';
        else if (subId === findSub('seregen')) finalDept = 'Formulation & Manufacturing';
        else if (subId === findSub('divasa')) finalDept = 'Therapeutics & Marketing';
        else if (subId === findSub('education')) finalDept = 'Advisory & Pathways';
        else if (subId === findSub('laboratories', 'labs')) finalDept = 'Diagnostics & Laboratory';
        else if (subId === findSub('ethicals')) finalDept = 'Ethical Pharmaceuticals';
        else if (subId === findSub('health')) finalDept = 'Healthcare Operations';
        else if (subId === findSub('consumer')) finalDept = 'Consumer & Retail';
        else if (subId === findSub('travel')) finalDept = 'Travel Services';
        else if (subId === findSub('holiday')) finalDept = 'Inbound Holidays';
        else if (subId === findSub('insurance')) finalDept = 'Insurance Brokerage';
        else if (subId === findSub('& co')) finalDept = 'Corporate Office';
        else if (subId === findSub('heladiv')) finalDept = 'Operations & Production';
        else if (subId === findSub('tea')) finalDept = 'Tea Operations';
        else if (subId === findSub('solutions')) finalDept = 'Industrial & Climate Solutions';
        else if (subId === findSub('aviation')) finalDept = 'Aviation Services';
        else if (subId === findSub('recruitment')) finalDept = 'Recruitment & Manpower';
        else if (subId === findSub('asset')) finalDept = 'Asset Management';
        else if (subId === findSub('invest')) finalDept = 'Money Market & Forex';
        else if (subId === findSub('citrus')) finalDept = 'Hospitality & Leisure';
        else finalDept = 'General';
    }

    return { subId, companyName, department: finalDept };
}

// Get Manually Added Users from local database
router.get('/manual', async (req, res) => {
    const { subsidiaryId } = req.query;
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE AND (u.is_synced = FALSE OR u.is_synced IS NULL)
        `;
        let params = [];
        if (subsidiaryId) {
            query += ' AND u.subsidiary_id = ?';
            params.push(subsidiaryId);
        }
        query += ' ORDER BY u.full_name ASC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching manually added directory from database' });
    }
});

// Get Microsoft Office 365 Users from local database
router.get('/office365', async (req, res) => {
    const { subsidiaryId } = req.query;
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, COALESCE(u.o365_company, s.name) as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.is_active = TRUE AND u.is_synced = TRUE
        `;
        let params = [];
        if (subsidiaryId) {
            query += ' AND u.subsidiary_id = ?';
            params.push(subsidiaryId);
        }
        query += ' ORDER BY u.full_name ASC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching office365 directory from database' });
    }
});

// Sync Microsoft Office 365 Users (Supports both Full Sync and Subsidiary-specific Sync for Subadmins)
router.post('/office365/sync', async (req, res) => {
    const { subsidiary_id, role } = req.body;
    try {
        const accessToken = await getAccessToken();

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

        console.log(`Sync: Retrieved ${graphUsers.length} total users from Graph API.`);

        // Load existing subsidiaries
        const [existingSubs] = await db.execute("SELECT id, name FROM subsidiaries");
        const subMapByName = new Map(existingSubs.map(s => [s.name.trim().toLowerCase(), s.id]));

        // Determine if this is a subsidiary-scoped sync (e.g. subadmin) or full sync (superadmin/groupadmin)
        let targetSub = null;
        if (subsidiary_id) {
            targetSub = existingSubs.find(s => Number(s.id) === Number(subsidiary_id));
        }

        // Load existing database users
        const [dbUsers] = await db.execute("SELECT id, email, is_synced, ignore_sync, is_active, subsidiary_id FROM users");
        const dbUserMap = new Map(dbUsers.map(u => [u.email.toLowerCase(), u]));

        const defaultPasswordHash = await bcrypt.hash('GS@2026', 10);
        let syncedCount = 0;
        let apiEmails = new Set();

        for (const u of graphUsers) {
            const email = (u.mail || u.userPrincipalName || '').trim().toLowerCase();
            if (!email || email === 'n/a') continue;

            apiEmails.add(email);

            const phoneVal = u.mobilePhone || (Array.isArray(u.businessPhones) && u.businessPhones[0]) || 'N/A';
            const { subId: detectedSubId, companyName: normalizedSubName, department: deptVal } = resolveSubsidiaryAndDepartment(u, existingSubs);
            let subId = detectedSubId;

            // Auto-create newly detected subsidiary from Azure AD if not yet in database
            if (!subId && normalizedSubName && !['GEORGE STEUART GROUP', 'OFFICE 365', 'GENERAL'].includes(normalizedSubName.toUpperCase())) {
                let foundSub = existingSubs.find(s => s.name.toLowerCase() === normalizedSubName.toLowerCase());
                if (!foundSub) {
                    try {
                        const [newSubRes] = await db.execute(
                            "INSERT INTO subsidiaries (name, category, status, employees) VALUES (?, 'General', 'Active', 0)",
                            [normalizedSubName]
                        );
                        foundSub = { id: newSubRes.insertId, name: normalizedSubName };
                        existingSubs.push(foundSub);
                        console.log(`Auto-created new subsidiary from Azure AD: ${normalizedSubName} (ID: ${foundSub.id})`);
                    } catch (e) {
                        console.error('Failed to auto-create subsidiary:', e.message);
                    }
                }
                if (foundSub) {
                    subId = foundSub.id;
                }
            }

            if (!subId) {
                // Fallback to parent company George Steuart & Co.
                subId = 1;
            }
            const jobVal = u.jobTitle || 'O365 Account';
            const fullName = u.displayName || 'Unnamed User';

            // If a specific subsidiary sync was requested:
            if (targetSub) {
                // Check if user belongs to this subsidiary
                const matchesDept = (u.department || '').toLowerCase().includes(targetSub.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
                                    (u.companyName || '').toLowerCase().includes(targetSub.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
                                    normalizedSubName.toLowerCase().includes(targetSub.name.toLowerCase());
                
                if (!matchesDept && subId !== targetSub.id) {
                    continue; // Skip users outside this subsidiary
                }
                subId = targetSub.id;
            }

            if (dbUserMap.has(email)) {
                // Update existing user
                const existing = dbUserMap.get(email);
                await db.execute(
                    `UPDATE users 
                     SET full_name = ?, phone = ?, subsidiary_id = COALESCE(?, subsidiary_id), o365_company = ?, department = ?, job_title = ?, is_active = TRUE, is_synced = TRUE 
                     WHERE id = ?`,
                    [fullName, phoneVal, subId, normalizedSubName, deptVal, jobVal, existing.id]
                );
                syncedCount++;
            } else {
                // Insert new user (default role: 'employee')
                await db.execute(
                    `INSERT INTO users 
                     (full_name, email, password, role, subsidiary_id, o365_company, department, job_title, phone, is_active, is_synced, ignore_sync, needs_password_change) 
                     VALUES (?, ?, ?, 'employee', ?, ?, ?, ?, ?, TRUE, TRUE, FALSE, TRUE)`,
                    [fullName, email, defaultPasswordHash, subId, normalizedSubName, deptVal, jobVal, phoneVal]
                );
                syncedCount++;
            }
        }

        // Update employee counts in subsidiaries table
        const [updatedSubs] = await db.execute("SELECT id FROM subsidiaries");
        for (const s of updatedSubs) {
            const [countRes] = await db.execute("SELECT COUNT(*) as count FROM users WHERE subsidiary_id = ? AND is_active = TRUE", [s.id]);
            await db.execute("UPDATE subsidiaries SET employees = ? WHERE id = ?", [countRes[0].count, s.id]);
        }

        const msg = targetSub
            ? `Successfully synchronized ${syncedCount} Azure Active Directory profiles for ${targetSub.name}!`
            : `Global Synchronization successful! Synced ${syncedCount} profiles across all subsidiaries.`;

        res.json({
            success: true,
            message: msg,
            syncedCount
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
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(response.data);
    } catch (err) {
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

// Add a new user (Manual Add by SuperAdmin, GroupAdmin, or SubAdmin)
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
        date_of_birth,
        creator_role,
        creator_subsidiary_id
    } = req.body;
    
    try {
        // Check if user already exists
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        let assignedRole = normalizeRole(role);
        let assignedSubId = subsidiary_id && subsidiary_id !== '' ? subsidiary_id : null;

        const activeCreatorRole = creator_role || req.body.author_role || req.body.role;
        const activeCreatorSubId = creator_subsidiary_id !== undefined ? creator_subsidiary_id : req.body.user_subsidiary_id;

        // Subadmin restrictions:
        if (isSubAdmin(activeCreatorRole)) {
            // Locked to subadmin's subsidiary
            assignedSubId = activeCreatorSubId;
            // Subadmin can only add standard employees
            assignedRole = 'employee';
        } else if (!isSuperOrGroupAdmin(activeCreatorRole)) {
            return res.status(403).json({ message: 'Not authorized to add employees' });
        }

        const hashedPassword = await bcrypt.hash(password || 'GS@2026', 10);
        
        const [result] = await db.execute(
            `INSERT INTO users 
             (full_name, email, password, role, subsidiary_id, department, job_title, phone, nic_number, employee_no, date_of_birth, is_active, is_synced, ignore_sync, needs_password_change) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, TRUE, TRUE)`,
            [
                full_name || null, 
                email || null, 
                hashedPassword, 
                assignedRole, 
                assignedSubId, 
                department || null, 
                job_title || null, 
                phone || null, 
                nic_number || null, 
                employee_no || null, 
                date_of_birth && date_of_birth !== '' ? date_of_birth : null
            ]
        );

        // Update employee count for this subsidiary
        if (assignedSubId) {
            const [countRes] = await db.execute("SELECT COUNT(*) as count FROM users WHERE subsidiary_id = ? AND is_active = TRUE", [assignedSubId]);
            await db.execute("UPDATE subsidiaries SET employees = ? WHERE id = ?", [countRes[0].count, assignedSubId]);
        }

        res.status(201).json({ id: result.insertId, message: 'Employee created successfully' });
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

// Update a user (admin action)
router.put('/:id', async (req, res) => {
    const { 
        full_name, 
        email, 
        role, 
        subsidiary_id, 
        department, 
        job_title, 
        phone, 
        date_of_birth, 
        nic_number, 
        employee_no,
        creator_role,
        creator_subsidiary_id
    } = req.body;

    try {
        const [targetUserRows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'User not found' });
        const targetUser = targetUserRows[0];

        let assignedRole = role ? normalizeRole(role) : targetUser.role;
        let assignedSubId = subsidiary_id !== undefined ? (subsidiary_id || null) : targetUser.subsidiary_id;

        // Subadmin validation
        if (isSubAdmin(creator_role)) {
            if (Number(targetUser.subsidiary_id) !== Number(creator_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to edit employee from another subsidiary' });
            }
            assignedSubId = creator_subsidiary_id; // locked
            // Subadmin cannot promote to superadmin or groupadmin
            if (assignedRole === 'superadmin' || assignedRole === 'groupadmin') {
                assignedRole = 'employee';
            }
        }

        await db.execute(
            'UPDATE users SET full_name=?, email=?, role=?, subsidiary_id=?, department=?, job_title=?, phone=?, date_of_birth=?, nic_number=?, employee_no=? WHERE id=?',
            [full_name, email, assignedRole, assignedSubId, department, job_title, phone, date_of_birth || null, nic_number || null, employee_no || null, req.params.id]
        );

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Deactivate (soft delete) a user
router.delete('/:id', async (req, res) => {
    const { creator_role, creator_subsidiary_id } = req.query;
    try {
        const [targetUserRows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'User not found' });
        const targetUser = targetUserRows[0];

        if (isSubAdmin(creator_role)) {
            if (Number(targetUser.subsidiary_id) !== Number(creator_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to deactivate employee from another subsidiary' });
            }
        }

        await db.execute('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password (admin sets temp password)
router.patch('/:id/reset-password', async (req, res) => {
    const { newPassword, creator_role, creator_subsidiary_id } = req.body;
    try {
        const [targetUserRows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'User not found' });
        const targetUser = targetUserRows[0];

        if (isSubAdmin(creator_role)) {
            if (Number(targetUser.subsidiary_id) !== Number(creator_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to reset password for employee from another subsidiary' });
            }
        }

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
