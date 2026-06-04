const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Get all alerts (Global + Subsidiary, or All if admin queries)
router.get('/', async (req, res) => {
    const { subsidiary_id, role } = req.query;

    try {
        let query = `
            SELECT a.*, s.name as subsidiary_name 
            FROM alerts a 
            LEFT JOIN subsidiaries s ON a.subsidiary_id = s.id
        `;
        let params = [];

        // If the user is NOT an admin, only show global alerts or alerts matching their subsidiary
        if (role !== 'super_admin' && role !== 'sub_admin' && role !== 'it_admin' && role !== 'hr_admin') {
            query += ' WHERE a.subsidiary_id IS NULL';
            if (subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '') {
                query += ' OR a.subsidiary_id = ?';
                params.push(subsidiary_id);
            }
        } else if ((role === 'sub_admin' || role === 'it_admin' || role === 'hr_admin') && subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '') {
            // For sub_admins on their alerts manager, show global + their subsidiary
            query += ' WHERE a.subsidiary_id IS NULL OR a.subsidiary_id = ?';
            params.push(subsidiary_id);
        }

        query += ' ORDER BY a.created_at DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a new alert
router.post('/', async (req, res) => {
    const { title, message, type, color, subsidiary_id } = req.body;

    if (!title || !message || !type || !color) {
        return res.status(400).json({ message: 'All fields (title, message, type, color) are required' });
    }

    try {
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        const [result] = await db.execute(
            'INSERT INTO alerts (title, message, type, color, subsidiary_id) VALUES (?, ?, ?, ?, ?)',
            [title, message, type, color, subId]
        );

        // Send notifications
        await createNotification({
            type: 'alert',
            message: `Critical Alert: ${title}`,
            link: '/alerts',
            subsidiary_id: subId
        });

        res.status(201).json({ id: result.insertId, message: 'Alert added successfully' });
    } catch (err) {
        console.error('Error adding alert:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an alert
router.delete('/:id', async (req, res) => {
    const alertId = req.params.id;

    try {
        const [result] = await db.execute('DELETE FROM alerts WHERE id = ?', [alertId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        res.json({ message: 'Alert deleted successfully' });
    } catch (err) {
        console.error('Error deleting alert:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
