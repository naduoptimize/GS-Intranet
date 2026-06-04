const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        // Block if a super_admin already exists
        const [existing] = await db.execute("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
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
             VALUES (?, ?, ?, 'super_admin', ?, ?, ?, TRUE, FALSE)`,
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

module.exports = router;
