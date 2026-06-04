const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Send a Message
router.post('/', async (req, res) => {
    const { sender_id, receiver_id, message_text } = req.body;

    if (!sender_id || !receiver_id || !message_text || message_text.trim() === '') {
        return res.status(400).json({ message: 'Missing required parameters' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)',
            [sender_id, receiver_id, message_text.trim()]
        );
        res.status(201).json({
            id: result.insertId,
            sender_id,
            receiver_id,
            message_text: message_text.trim(),
            is_read: false,
            created_at: new Date()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Fetch Conversation History between two users
router.get('/conversation/:userId', async (req, res) => {
    const { userId } = req.params;
    const { otherId } = req.query;

    if (!userId || !otherId) {
        return res.status(400).json({ message: 'Missing user parameters' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT * FROM messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?) 
             ORDER BY created_at ASC`,
            [userId, otherId, otherId, userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Get list of all recent conversations with last message and unread count
router.get('/conversations/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Missing user parameters' });
    }

    try {
        const query = `
            SELECT 
                partner.id AS id,
                partner.full_name,
                partner.email,
                partner.profile_pic,
                partner.role,
                partner.job_title,
                s.name AS subsidiary_name,
                m.message_text AS last_message,
                m.created_at AS last_message_time,
                (SELECT COUNT(*) FROM messages WHERE sender_id = partner.id AND receiver_id = ? AND is_read = FALSE) AS unread_count
            FROM (
                SELECT 
                    CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END AS partner_id,
                    MAX(id) AS max_message_id
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY partner_id
            ) AS latest_chats
            JOIN users partner ON latest_chats.partner_id = partner.id
            LEFT JOIN subsidiaries s ON partner.subsidiary_id = s.id
            JOIN messages m ON latest_chats.max_message_id = m.id
            ORDER BY m.created_at DESC;
        `;
        const [rows] = await db.execute(query, [userId, userId, userId, userId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Mark all messages from a specific sender to receiver as read
router.put('/read/:senderId', async (req, res) => {
    const { senderId } = req.params;
    const { receiver_id } = req.body;

    if (!senderId || !receiver_id) {
        return res.status(400).json({ message: 'Missing user parameters' });
    }

    try {
        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [senderId, receiver_id]
        );
        res.json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. Admin: Fetch All Conversations in the Company
router.get('/admin/conversations', async (req, res) => {
    const { subsidiaryId } = req.query;
    try {
        let query = `
            SELECT 
                m.id AS last_message_id,
                m.message_text AS last_message,
                m.created_at AS last_message_time,
                u1.id AS sender_id,
                u1.full_name AS sender_name,
                u1.email AS sender_email,
                s1.name AS sender_subsidiary,
                u2.id AS receiver_id,
                u2.full_name AS receiver_name,
                u2.email AS receiver_email,
                s2.name AS receiver_subsidiary,
                (SELECT COUNT(*) FROM messages WHERE (sender_id = u1.id AND receiver_id = u2.id) OR (sender_id = u2.id AND receiver_id = u1.id)) AS total_messages
            FROM messages m
            INNER JOIN (
                SELECT 
                    LEAST(sender_id, receiver_id) AS user_a,
                    GREATEST(sender_id, receiver_id) AS user_b,
                    MAX(id) AS max_id
                FROM messages
                GROUP BY user_a, user_b
            ) AS unique_chats ON m.id = unique_chats.max_id
            INNER JOIN users u1 ON m.sender_id = u1.id
            LEFT JOIN subsidiaries s1 ON u1.subsidiary_id = s1.id
            INNER JOIN users u2 ON m.receiver_id = u2.id
            LEFT JOIN subsidiaries s2 ON u2.subsidiary_id = s2.id
        `;
        let params = [];
        if (subsidiaryId) {
            query += ' WHERE u1.subsidiary_id = ? OR u2.subsidiary_id = ?';
            params = [subsidiaryId, subsidiaryId];
        }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 6. Admin: Delete / Moderate a Message
router.delete('/admin/message/:messageId', async (req, res) => {
    const { messageId } = req.params;
    try {
        await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);
        res.json({ message: 'Message deleted successfully ✓' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
