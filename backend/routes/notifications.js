const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all notifications for a specific user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark a single notification as read
router.put('/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all notifications as read for a user
router.put('/read-all/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new notification
router.post('/', async (req, res) => {
    const { user_id, type, message, link } = req.body;
    if (!user_id || !message) return res.status(400).json({ message: 'user_id and message are required' });
    try {
        const [result] = await db.execute(
            'INSERT INTO notifications (user_id, type, message, link, is_read) VALUES (?, ?, ?, ?, 0)',
            [user_id, type, message, link]
        );
        res.status(201).json({ id: result.insertId, message: 'Notification created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
