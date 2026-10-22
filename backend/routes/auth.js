const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT u.*, s.name as subsidiary_name FROM users u LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id WHERE u.email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, subsidiary_id: user.subsidiary_id, department: user.department },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department,
                subsidiary_id: user.subsidiary_id,
                subsidiary_name: user.subsidiary_name,
                profile_pic: user.profile_pic,
                needs_password_change: user.needs_password_change
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change Password Route
router.put('/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ?, needs_password_change = FALSE WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify Identity Route (Step 1 of Forgot Password)
router.post('/verify-identity', async (req, res) => {
    const { email, employee_no, nic_number } = req.body;

    if (!email || !employee_no || !nic_number) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND employee_no = ? AND nic_number = ? AND is_active = TRUE',
            [email.trim(), employee_no.trim(), nic_number.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Verification failed. Please double-check your Email, Employee ID, and NIC Number.' });
        }

        res.json({ success: true, message: 'Identity verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password / Self-Service Reset Route
router.post('/forgot-password', async (req, res) => {
    const { email, employee_no, nic_number, newPassword } = req.body;

    if (!email || !employee_no || !nic_number || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find user by email, employee_no, and nic_number
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND employee_no = ? AND nic_number = ? AND is_active = TRUE',
            [email.trim(), employee_no.trim(), nic_number.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Verification failed. Please double-check your Email, Employee ID, and NIC Number.' });
        }

        const user = rows[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and mark needs_password_change as false
        await db.execute(
            'UPDATE users SET password = ?, needs_password_change = FALSE WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register Super Admin (public — first-time setup only)
router.post('/register-super-admin', async (req, res) => {
    const { full_name, email, password, nic_number, employee_no, date_of_birth } = req.body;

    if (!full_name || !email || !password || !nic_number || !employee_no) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    try {
        // Block if a superadmin already exists
        const [existing] = await db.execute("SELECT id FROM users WHERE role IN ('superadmin', 'super_admin') LIMIT 1");
        if (existing.length > 0) {
            return res.status(403).json({ message: 'A Super Admin account already exists. Please contact your system administrator.' });
        }

        // Check email uniqueness
        const [emailCheck] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users 
             (full_name, email, password, role, nic_number, employee_no, date_of_birth, is_active, needs_password_change) 
             VALUES (?, ?, ?, 'superadmin', ?, ?, ?, TRUE, FALSE)`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                nic_number.trim(),
                employee_no.trim(),
                date_of_birth && date_of_birth !== '' ? date_of_birth : null
            ]
        );

        res.status(201).json({ message: 'Super Admin account created successfully.', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// =====================================================================
// Microsoft 365 / Azure AD OAuth Routes
// =====================================================================

// Initiate Microsoft OAuth Login (redirects directly to Microsoft login)
router.get('/microsoft', (req, res) => {
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const redirectUri = process.env.AZURE_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';
    
    if (!clientId || !tenantId) {
        return res.status(500).json({ message: 'Microsoft configuration is missing on server (.env).' });
    }
    
    const scope = encodeURIComponent('openid profile email User.Read');
    const state = 'microsoft-auth-flow';
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}&state=${state}`;
    
    res.redirect(authUrl);
});

// Get Microsoft OAuth Authorization URL as JSON
router.get('/microsoft/url', (req, res) => {
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const redirectUri = process.env.AZURE_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';
    
    if (!clientId || !tenantId) {
        return res.status(500).json({ message: 'Microsoft configuration is missing on server (.env).' });
    }
    
    const scope = encodeURIComponent('openid profile email User.Read');
    const state = 'microsoft-auth-flow';
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}&state=${state}`;
    
    res.json({ authUrl, clientId, tenantId, redirectUri });
});

// Microsoft 365 OAuth Callback Route
router.get('/microsoft/callback', async (req, res) => {
    const { code, error, error_description } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (error) {
        console.error('Microsoft OAuth error response:', error, error_description);
        return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent(error_description || error));
    }
    
    if (!code) {
        return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent('Authorization code is missing.'));
    }
    
    try {
        const clientId = process.env.AZURE_CLIENT_ID;
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const redirectUri = process.env.AZURE_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';
        
        if (!clientId || !tenantId || !clientSecret) {
            return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent('Microsoft configuration is missing on server (.env).'));
        }
        
        // Exchange code for Access Token
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', clientId);
        tokenParams.append('client_secret', clientSecret);
        tokenParams.append('grant_type', 'authorization_code');
        tokenParams.append('code', code);
        tokenParams.append('redirect_uri', redirectUri);
        
        console.log('Exchanging auth code for Microsoft token...');
        const tokenRes = await axios.post(tokenUrl, tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const accessToken = tokenRes.data.access_token;
        
        // Fetch User profile from Microsoft Graph
        console.log('Querying Graph API User Profile (/v1.0/me)...');
        const profileRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        
        const me = profileRes.data;
        const email = (me.mail || me.userPrincipalName || '').trim().toLowerCase();
        
        if (!email) {
            return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent('Could not retrieve email from Microsoft profile.'));
        }
        
        // Check if user exists in the database
        const [rows] = await db.execute(
            'SELECT u.*, s.name as subsidiary_name FROM users u LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id WHERE u.email = ?',
            [email]
        );
        
        let user;
        if (rows.length === 0) {
            // User does not exist, create a new active user
            console.log(`Microsoft login: Creating new user for ${email}...`);
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const fullName = me.displayName || email.split('@')[0];
            
            const [insertResult] = await db.execute(
                `INSERT INTO users 
                 (full_name, email, password, role, is_active, is_synced, ignore_sync, needs_password_change) 
                 VALUES (?, ?, ?, 'employee', 1, 1, 0, 0)`,
                [fullName, email, hashedPassword]
            );
            
            const [newRows] = await db.execute(
                'SELECT u.*, s.name as subsidiary_name FROM users u LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id WHERE u.id = ?',
                [insertResult.insertId]
            );
            user = newRows[0];
        } else {
            user = rows[0];
            
            // If the user's account is deactivated, reject
            if (!user.is_active) {
                return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent('Your account has been deactivated. Please contact your administrator.'));
            }
            
            // For Microsoft authenticated users, bypass password change
            if (user.needs_password_change) {
                await db.execute('UPDATE users SET needs_password_change = 0 WHERE id = ?', [user.id]);
                user.needs_password_change = 0;
            }
        }
        
        // Sign local JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role, subsidiary_id: user.subsidiary_id, department: user.department },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log(`Microsoft login successful for ${email}. Redirecting to frontend...`);
        const userObj = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
            subsidiary_id: user.subsidiary_id,
            subsidiary_name: user.subsidiary_name,
            profile_pic: user.profile_pic,
            needs_password_change: false
        };
        
        return res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userObj))}`);
        
    } catch (err) {
        console.error('Microsoft Login Callback Error:', err.response?.data || err.message);
        const errMsg = err.response?.data?.error_description || err.response?.data?.error || err.message || 'Microsoft authentication failed.';
        return res.redirect(`${frontendUrl}/login?error=` + encodeURIComponent(errMsg));
    }
});

module.exports = router;

