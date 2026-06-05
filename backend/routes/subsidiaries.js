const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all subsidiaries with staff count
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.*, COUNT(u.id) as staff_count 
            FROM subsidiaries s 
            LEFT JOIN users u ON s.id = u.subsidiary_id 
            GROUP BY s.id 
            ORDER BY s.name ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all directors across all subsidiaries
router.get('/directors/all', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM subsidiary_directors');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single subsidiary with staff count
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.*, COUNT(u.id) as staff_count 
            FROM subsidiaries s 
            LEFT JOIN users u ON s.id = u.subsidiary_id 
            WHERE s.id = ?
            GROUP BY s.id
        `, [req.params.id]);
        
        if (rows.length === 0) return res.status(404).json({ message: 'Subsidiary not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new subsidiary
router.post('/', async (req, res) => {
    const { name, description, mission, vision, location, website, email, phone, phone_2 } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    try {
        const [result] = await db.execute(
            'INSERT INTO subsidiaries (name, description, mission, vision, location, website, email, phone, phone_2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description || null, mission || null, vision || null, location || null, website || null, email || null, phone || null, phone_2 || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Subsidiary added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update subsidiary
router.put('/:id', async (req, res) => {
    const { name, description, mission, vision, location, website, email, phone, phone_2 } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    try {
        await db.execute(
            'UPDATE subsidiaries SET name = ?, description = ?, mission = ?, vision = ?, location = ?, website = ?, email = ?, phone = ?, phone_2 = ? WHERE id = ?',
            [name, description || null, mission || null, vision || null, location || null, website || null, email || null, phone || null, phone_2 || null, req.params.id]
        );
        res.json({ message: 'Subsidiary updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete subsidiary
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM subsidiaries WHERE id = ?', [req.params.id]);
        res.json({ message: 'Subsidiary deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// -- DIRECTORS ENDPOINTS --

// Get directors for a subsidiary
router.get('/:id/directors', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT sd.*, u.email, u.full_name AS user_name, u.job_title AS user_title, u.profile_pic AS user_profile_pic, u.is_synced
            FROM subsidiary_directors sd
            LEFT JOIN users u ON sd.user_id = u.id
            WHERE sd.subsidiary_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a director
router.post('/:id/directors', async (req, res) => {
    const { user_id, name, title, bio, image_url } = req.body;
    try {
        let finalName = name;
        let finalTitle = title;
        let finalImageUrl = image_url;

        if (user_id) {
            const [users] = await db.execute('SELECT full_name, job_title, profile_pic FROM users WHERE id = ?', [user_id]);
            if (users.length === 0) {
                return res.status(400).json({ message: 'Linked user not found' });
            }
            const user = users[0];
            finalName = finalName || user.full_name;
            finalTitle = finalTitle || user.job_title || 'Director';
            finalImageUrl = finalImageUrl || user.profile_pic;
        }

        if (!finalName) {
            return res.status(400).json({ message: 'Director name is required' });
        }

        const [result] = await db.execute(
            'INSERT INTO subsidiary_directors (subsidiary_id, user_id, name, title, bio, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, user_id || null, finalName, finalTitle || null, bio || null, finalImageUrl || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Director added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a director
router.put('/directors/:dirId', async (req, res) => {
    const { name, title, bio, image_url } = req.body;
    if (!name) return res.status(400).json({ message: 'Director name is required' });
    try {
        await db.execute(
            'UPDATE subsidiary_directors SET name = ?, title = ?, bio = ?, image_url = ? WHERE id = ?',
            [name, title || null, bio || null, image_url || null, req.params.dirId]
        );
        res.json({ message: 'Director updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a director
router.delete('/directors/:dirId', async (req, res) => {
    try {
        await db.execute('DELETE FROM subsidiary_directors WHERE id = ?', [req.params.dirId]);
        res.json({ message: 'Director deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
