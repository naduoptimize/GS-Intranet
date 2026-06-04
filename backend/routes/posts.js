const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// Get all posts (Global + User's Subsidiary, or All if no subsidiary provided)
router.get('/', async (req, res) => {
    const { subsidiary_id, user_id } = req.query;
    
    try {
        let query = `
            SELECT p.*, u.full_name as author_name, u.profile_pic, s.name as subsidiary_name,
            (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments,
            (SELECT GROUP_CONCAT(DISTINCT type) FROM reactions WHERE post_id = p.id) as reaction_types
        `;
        let params = [];

        if (user_id && user_id !== 'undefined' && user_id !== 'null' && user_id !== '') {
            query += `, (SELECT type FROM reactions WHERE post_id = p.id AND user_id = ?) as user_reaction `;
            params.push(user_id);
        } else {
            query += `, NULL as user_reaction `;
        }

        query += `
            FROM posts p
            JOIN users u ON p.author_id = u.id
            LEFT JOIN subsidiaries s ON p.subsidiary_id = s.id
        `;

        let whereClauses = [];
        if (subsidiary_id && subsidiary_id !== 'undefined' && subsidiary_id !== 'null' && subsidiary_id !== '') {
            whereClauses.push("(p.visibility = 'global' OR p.subsidiary_id = ?)");
            params.push(subsidiary_id);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }

        query += ' ORDER BY p.is_pinned DESC, p.created_at DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/Unlike/React to a post
router.post('/:id/like', async (req, res) => {
    const { user_id, type = 'like' } = req.body;
    const post_id = req.params.id;
    try {
        const [existing] = await db.execute('SELECT * FROM reactions WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
        if (existing.length > 0) {
            if (existing[0].type === type) {
                // If same type clicked, delete (unreact)
                await db.execute('DELETE FROM reactions WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
                return res.json({ message: 'Unliked', action: 'remove' });
            } else {
                // If different type clicked, update
                await db.execute('UPDATE reactions SET type = ? WHERE post_id = ? AND user_id = ?', [type, post_id, user_id]);
                return res.json({ message: 'Reaction updated', action: 'update', type });
            }
        }
        await db.execute('INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, ?)', [post_id, user_id, type]);
        res.json({ message: 'Liked', action: 'add', type });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reactions for a post (with user details)
router.get('/:id/reactions', async (req, res) => {
    const post_id = req.params.id;
    try {
        const [rows] = await db.execute(
            `SELECT r.type, u.id as user_id, u.full_name, u.profile_pic, s.name as subsidiary_name
             FROM reactions r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id
             WHERE r.post_id = ?
             ORDER BY r.created_at DESC`,
            [post_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Comment on a post
router.post('/:id/comment', async (req, res) => {
    const { user_id, content } = req.body;
    const post_id = req.params.id;
    try {
        await db.execute('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [post_id, user_id, content]);
        res.json({ message: 'Comment added' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
    const post_id = req.params.id;
    try {
        const [rows] = await db.execute(
            `SELECT c.*, u.full_name as author_name, u.profile_pic 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.post_id = ? 
             ORDER BY c.created_at ASC`,
            [post_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a comment (only the comment owner)
router.delete('/:postId/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { user_id } = req.body;
    try {
        const [comment] = await db.execute('SELECT * FROM comments WHERE id = ?', [commentId]);
        if (comment.length === 0) return res.status(404).json({ message: 'Comment not found' });
        if (comment[0].user_id !== parseInt(user_id)) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }
        await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a post
router.post('/', async (req, res) => {
    const { author_id, content, image_url, type, visibility, subsidiary_id } = req.body;
    
    try {
        const subId = visibility === 'global' ? null : subsidiary_id;
        const [result] = await db.execute(
            'INSERT INTO posts (author_id, content, image_url, type, visibility, subsidiary_id) VALUES (?, ?, ?, ?, ?, ?)',
            [author_id, content, image_url, type, visibility, subId]
        );
        
        // Send notifications
        const contentPreview = content.length > 50 ? content.substring(0, 47) + '...' : content;
        await createNotification({
            type: 'post',
            message: `New announcement posted: ${contentPreview}`,
            link: '/feed',
            subsidiary_id: subId,
            exclude_user_id: author_id
        });

        res.status(201).json({ id: result.insertId, message: 'Post created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        // Delete related reactions and comments first to maintain referential integrity
        await db.execute('DELETE FROM reactions WHERE post_id = ?', [postId]);
        await db.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
        const [result] = await db.execute('DELETE FROM posts WHERE id = ?', [postId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a post
router.put('/:id', async (req, res) => {
    const postId = req.params.id;
    const { content, type, visibility, subsidiary_id, image_url } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE posts SET content = ?, type = ?, visibility = ?, subsidiary_id = ?, image_url = ? WHERE id = ?',
            [content, type, visibility, visibility === 'global' ? null : subsidiary_id, image_url || null, postId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({ message: 'Post updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle pin status of a post
router.put('/:id/pin', async (req, res) => {
    const postId = req.params.id;
    const { is_pinned } = req.body;
    try {
        await db.execute('UPDATE posts SET is_pinned = ? WHERE id = ?', [is_pinned ? 1 : 0, postId]);
        res.json({ message: is_pinned ? 'Post pinned successfully' : 'Post unpinned successfully', is_pinned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle flag status of a post (flag as inappropriate)
router.put('/:id/flag', async (req, res) => {
    const postId = req.params.id;
    const { is_flagged } = req.body;
    try {
        await db.execute('UPDATE posts SET is_flagged = ? WHERE id = ?', [is_flagged ? 1 : 0, postId]);
        res.json({ message: is_flagged ? 'Post flagged for moderation' : 'Post unflagged', is_flagged });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
