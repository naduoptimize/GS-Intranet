const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');
const { isSuperOrGroupAdmin, isSubAdmin } = require('../utils/roles');

// Get all alerts (Global + Subsidiary, or All if super/group admin queries)
router.get('/', async (req, res) => {
    const { subsidiary_id, role } = req.query;

    try {
        let query = `
            SELECT a.*, s.name as subsidiary_name 
            FROM alerts a 
            LEFT JOIN subsidiaries s ON a.subsidiary_id = s.id
        `;
        let params = [];

        if (isSuperOrGroupAdmin(role)) {
            // Super Admin or Group Admin can see all, or filter by specific subsidiary if requested
            if (subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '' && subsidiary_id !== 'all') {
                query += ' WHERE a.subsidiary_id = ?';
                params.push(subsidiary_id);
            }
        } else if (isSubAdmin(role)) {
            // Sub Admin sees global alerts PLUS their own subsidiary's alerts (or in admin view, their subsidiary)
            const subId = subsidiary_id || req.user?.subsidiary_id;
            if (subId && subId !== 'null' && subId !== 'undefined' && subId !== '') {
                query += ' WHERE a.subsidiary_id IS NULL OR a.subsidiary_id = ?';
                params.push(subId);
            } else {
                query += ' WHERE a.subsidiary_id IS NULL';
            }
        } else {
            // Standard Employee: can ONLY see global alerts OR alerts for their own subsidiary
            if (subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '') {
                query += ' WHERE a.subsidiary_id IS NULL OR a.subsidiary_id = ?';
                params.push(subsidiary_id);
            } else {
                query += ' WHERE a.subsidiary_id IS NULL';
            }
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
    const { title, message, type, color, subsidiary_id, role, user_subsidiary_id } = req.body;

    if (!title || !message || !type || !color) {
        return res.status(400).json({ message: 'All fields (title, message, type, color) are required' });
    }

    try {
        let targetSubId = subsidiary_id;

        // If author is subadmin, force their own subsidiary_id
        if (isSubAdmin(role)) {
            targetSubId = user_subsidiary_id || subsidiary_id;
            if (!targetSubId || targetSubId === 'null') {
                return res.status(400).json({ message: 'Sub Admin must specify a valid subsidiary' });
            }
        } else if (isSuperOrGroupAdmin(role)) {
            // Super Admin or Group Admin can set Global (null) or a specific subsidiary
            if (targetSubId === 'null' || targetSubId === 'global' || targetSubId === '' || !targetSubId) {
                targetSubId = null;
            }
        } else {
            return res.status(403).json({ message: 'Employees are not authorized to create alerts' });
        }

        const [result] = await db.execute(
            'INSERT INTO alerts (title, message, type, color, subsidiary_id) VALUES (?, ?, ?, ?, ?)',
            [title, message, type, color, targetSubId]
        );

        // Send notifications
        await createNotification({
            type: 'alert',
            message: `Critical Alert: ${title}`,
            link: '/alerts',
            subsidiary_id: targetSubId
        });

        res.status(201).json({ id: result.insertId, message: 'Alert added successfully' });
    } catch (err) {
        console.error('Error adding alert:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an alert
router.put('/:id', async (req, res) => {
    const alertId = req.params.id;
    const { title, message, type, color, subsidiary_id, role, user_subsidiary_id } = req.body;

    try {
        const [alertRows] = await db.execute('SELECT subsidiary_id FROM alerts WHERE id = ?', [alertId]);
        if (alertRows.length === 0) return res.status(404).json({ message: 'Alert not found' });

        if (isSubAdmin(role)) {
            if (Number(alertRows[0].subsidiary_id) !== Number(user_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to update alert from another subsidiary' });
            }
        } else if (!isSuperOrGroupAdmin(role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        let targetSubId = subsidiary_id;
        if (isSubAdmin(role)) {
            targetSubId = user_subsidiary_id;
        } else if (targetSubId === 'null' || targetSubId === 'global' || targetSubId === '' || !targetSubId) {
            targetSubId = null;
        }

        await db.execute(
            'UPDATE alerts SET title = ?, message = ?, type = ?, color = ?, subsidiary_id = ? WHERE id = ?',
            [title, message, type, color, targetSubId, alertId]
        );

        res.json({ message: 'Alert updated successfully' });
    } catch (err) {
        console.error('Error updating alert:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an alert
router.delete('/:id', async (req, res) => {
    const alertId = req.params.id;
    const { role, user_subsidiary_id } = req.query;

    try {
        // If subadmin, verify the alert belongs to their subsidiary
        if (isSubAdmin(role)) {
            const [alertRows] = await db.execute('SELECT subsidiary_id FROM alerts WHERE id = ?', [alertId]);
            if (alertRows.length === 0) return res.status(404).json({ message: 'Alert not found' });
            if (Number(alertRows[0].subsidiary_id) !== Number(user_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to delete alert from another subsidiary' });
            }
        }

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
