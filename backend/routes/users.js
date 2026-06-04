const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users with subsidiary info
router.get('/', async (req, res) => {
    const { subsidiaryId } = req.query;
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.role, u.department, u.job_title, u.phone, u.profile_pic, u.bio, u.subsidiary_id, u.date_of_birth, u.nic_number, u.employee_no, s.name as subsidiary_name 
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

