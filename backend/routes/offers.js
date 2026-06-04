const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

// GET all offers (with role/subsidiary filtering)
router.get('/', async (req, res) => {
    const { role, subsidiary_id } = req.query;

    let query = 'SELECT * FROM offers';
    let queryParams = [];

    if (role === 'super_admin') {
        query += ' ORDER BY created_at DESC';
    } else if (subsidiary_id) {
        query += ' WHERE subsidiary_id IS NULL OR subsidiary_id = ? ORDER BY created_at DESC';
        queryParams.push(subsidiary_id);
    } else {
        query += ' WHERE subsidiary_id IS NULL ORDER BY created_at DESC';
    }

    try {
        const [results] = await db.execute(query, queryParams);
        res.json(results);
    } catch (err) {
        console.error('Error fetching offers:', err);
        res.status(500).json({ message: 'Error fetching offers' });
    }
});

// POST a new offer
router.post('/', async (req, res) => {
    const { category, badge, title, description, cta, gradient, emoji, image_url, valid_until, savings, subsidiary_id } = req.body;

    const query = `
        INSERT INTO offers 
        (category, badge, title, description, cta, gradient, emoji, image_url, valid_until, savings, subsidiary_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [category, badge, title, description, cta, gradient, emoji, image_url || null, valid_until, savings, subsidiary_id || null];

    try {
        const [result] = await db.execute(query, values);

        // Send notifications
        await createNotification({
            type: 'offer',
            message: `New benefit offer: ${title}`,
            link: '/offers',
            subsidiary_id: subsidiary_id
        });

        res.status(201).json({ message: 'Offer created successfully', id: result.insertId });
    } catch (err) {
        console.error('Error creating offer:', err);
        res.status(500).json({ message: 'Error creating offer' });
    }
});

// PUT update an offer
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { category, badge, title, description, cta, gradient, emoji, image_url, valid_until, savings, subsidiary_id } = req.body;

    const query = `
        UPDATE offers 
        SET category = ?, badge = ?, title = ?, description = ?, cta = ?, gradient = ?, emoji = ?, image_url = ?, valid_until = ?, savings = ?, subsidiary_id = ?
        WHERE id = ?
    `;
    const values = [category, badge, title, description, cta, gradient, emoji, image_url || null, valid_until, savings, subsidiary_id || null, id];

    try {
        await db.execute(query, values);
        res.json({ message: 'Offer updated successfully' });
    } catch (err) {
        console.error('Error updating offer:', err);
        res.status(500).json({ message: 'Error updating offer' });
    }
});

// DELETE an offer
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM offers WHERE id = ?';

    try {
        await db.execute(query, [id]);
        res.json({ message: 'Offer deleted successfully' });
    } catch (err) {
        console.error('Error deleting offer:', err);
        res.status(500).json({ message: 'Error deleting offer' });
    }
});

module.exports = router;
