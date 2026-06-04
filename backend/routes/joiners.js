const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all joiners
router.get('/', async (req, res) => {
    const { subsidiary_id } = req.query;
    try {
        let query = 'SELECT * FROM new_joiners';
        const params = [];
        if (subsidiary_id && subsidiary_id !== 'undefined' && subsidiary_id !== 'null' && subsidiary_id !== '') {
            query += ' WHERE subsidiary_id = ? OR subsidiary_id IS NULL';
            params.push(subsidiary_id);
        }
        query += ' ORDER BY join_date DESC, created_at DESC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new joiner
router.post('/', async (req, res) => {
    const { name, department, join_date, profile_photo, group_image, group_details } = req.body;
    if (!name || !department || !join_date) {
        return res.status(400).json({ message: 'Name, department, and join date are required' });
    }
    try {
        const [result] = await db.execute(
            `INSERT INTO new_joiners (name, department, join_date, profile_photo, group_image, group_details) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, department, join_date, profile_photo || null, group_image || null, group_details || null]
        );
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            department, 
            join_date, 
            profile_photo, 
            group_image, 
            group_details,
            message: 'New joiner welcomed successfully' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update joiner details (and group image / details)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, department, join_date, profile_photo, group_image, group_details } = req.body;
    if (!name || !department || !join_date) {
        return res.status(400).json({ message: 'Name, department, and join date are required' });
    }
    try {
        const [result] = await db.execute(
            `UPDATE new_joiners 
             SET name = ?, department = ?, join_date = ?, profile_photo = ?, group_image = ?, group_details = ? 
             WHERE id = ?`,
            [name, department, join_date, profile_photo || null, group_image || null, group_details || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Joiner not found' });
        res.json({ id, name, department, join_date, profile_photo, group_image, group_details, message: 'Joiner updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete joiner
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM new_joiners WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Joiner not found' });
        res.json({ message: 'Joiner deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
