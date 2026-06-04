const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Get all memories
router.get('/', async (req, res) => {
    const { subsidiaryId, role, userId } = req.query;
    try {
        let query = `
            SELECT m.*, u.full_name as author_name, s.name as subsidiary_name,
                   COALESCE((SELECT COUNT(*) FROM memory_likes ml WHERE ml.memory_id = m.id), 0) as likes_count,
                   ${userId ? `(SELECT COUNT(*) FROM memory_likes ml WHERE ml.memory_id = m.id AND ml.user_id = ?) > 0` : '0'} as has_liked
            FROM memories m 
            LEFT JOIN users u ON m.author_id = u.id 
            LEFT JOIN subsidiaries s ON m.subsidiary_id = s.id 
        `;
        let params = [];
        if (userId) {
            params.push(userId);
        }

        if (role !== 'super_admin' && subsidiaryId) {
            query += params.length > 0 ? ' WHERE' : ' WHERE';
            query += ' m.subsidiary_id = ? OR m.subsidiary_id IS NULL';
            params.push(subsidiaryId);
        }
        query += ' ORDER BY m.created_at DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a memory (Admins only)
router.post('/', async (req, res) => {
    const { title, description, image_url, author_id, subsidiary_id } = req.body;
    try {
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        const [result] = await db.execute(
            'INSERT INTO memories (title, description, image_url, author_id, subsidiary_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, image_url, author_id, subId]
        );

        // Send notifications
        await createNotification({
            type: 'memory',
            message: `New memory shared: ${title}`,
            link: '/memories',
            subsidiary_id: subId,
            exclude_user_id: author_id
        });

        res.status(201).json({ id: result.insertId, message: 'Memory added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// React to a memory (Toggle Like)
router.post('/:id/like', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to react' });
    }
    try {
        // Check if already liked
        const [existing] = await db.execute(
            'SELECT * FROM memory_likes WHERE memory_id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.execute(
                'DELETE FROM memory_likes WHERE memory_id = ? AND user_id = ?',
                [req.params.id, userId]
            );
            await db.execute('UPDATE memories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [req.params.id]);
            res.json({ message: 'Reaction removed', liked: false });
        } else {
            // Like
            await db.execute(
                'INSERT INTO memory_likes (memory_id, user_id) VALUES (?, ?)',
                [req.params.id, userId]
            );
            await db.execute('UPDATE memories SET likes_count = likes_count + 1 WHERE id = ?', [req.params.id]);
            res.json({ message: 'Reaction recorded', liked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get list of users who liked a memory (Admins only)
router.get('/:id/likers', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id, u.full_name, u.profile_pic, u.email, s.name as subsidiary_name
            FROM memory_likes ml
            JOIN users u ON ml.user_id = u.id
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
            WHERE ml.memory_id = ?
            ORDER BY ml.created_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a memory (Admins only)
router.put('/:id', async (req, res) => {
    const { title, description, image_url, subsidiary_id } = req.body;
    try {
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        await db.execute(
            'UPDATE memories SET title = ?, description = ?, image_url = ?, subsidiary_id = ? WHERE id = ?',
            [title, description, image_url, subId, req.params.id]
        );
        res.json({ message: 'Memory updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a memory (Admins only)
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM memories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Memory deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
