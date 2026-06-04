const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all facts
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM company_facts ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new fact
router.post('/', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    try {
        const [result] = await db.execute('INSERT INTO company_facts (content) VALUES (?)', [content]);
        res.status(201).json({ id: result.insertId, content, message: 'Fact added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a fact
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    try {
        const [result] = await db.execute('UPDATE company_facts SET content = ? WHERE id = ?', [content, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Fact not found' });
        res.json({ id, content, message: 'Fact updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a fact
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM company_facts WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Fact not found' });
        res.json({ message: 'Fact deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
