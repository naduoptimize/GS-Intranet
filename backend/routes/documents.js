const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../utils/notifications');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/documents';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Get documents (Global + User's Subsidiary)
router.get('/', async (req, res) => {
    const { subsidiaryId, role } = req.query;
    try {
        let query = `
            SELECT d.*, s.name as subsidiary_name 
            FROM documents d 
            LEFT JOIN subsidiaries s ON d.subsidiary_id = s.id 
        `;
        let params = [];

        // Visibility Rules:
        // Super Admin sees everything.
        // Others see Global (null) + their own subsidiary.
        if (role !== 'super_admin') {
            query += ' WHERE d.subsidiary_id IS NULL OR d.subsidiary_id = ?';
            params.push(subsidiaryId || null);
        }

        query += ' ORDER BY d.created_at DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload a document
router.post('/', upload.single('file'), async (req, res) => {
    const { title, category, subsidiary_id, uploaded_by } = req.body;
    const file_url = req.file ? `/uploads/documents/${req.file.filename}` : null;

    if (!file_url) {
        return res.status(400).json({ message: 'File is required' });
    }
    
    try {
        if (!title || !category) {
            return res.status(400).json({ message: 'Title and category are required' });
        }

        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        const userId = uploaded_by || null;

        await db.execute(
            'INSERT INTO documents (title, category, file_url, subsidiary_id, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            [title, category, file_url, subId, userId]
        );

        // Send notifications
        await createNotification({
            type: 'document',
            message: `New document uploaded: ${title}`,
            link: '/documents',
            subsidiary_id: subId,
            exclude_user_id: userId
        });

        res.status(201).json({ message: 'Document added successfully' });
    } catch (err) {
        console.error('Database Error:', err);
        res.status(500).json({ message: 'Database error: ' + err.message });
    }
});

// Delete a document
router.delete('/:id', async (req, res) => {
    try {
        // First get the file_url to delete the physical file
        const [docs] = await db.execute('SELECT file_url FROM documents WHERE id = ?', [req.params.id]);
        if (docs.length > 0) {
            const filePath = path.join(__dirname, '..', docs[0].file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await db.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
        res.json({ message: 'Document deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Edit a document
router.put('/:id', async (req, res) => {
    const { title, category, subsidiary_id } = req.body;
    try {
        if (!title || !category) {
            return res.status(400).json({ message: 'Title and category are required' });
        }
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;

        await db.execute(
            'UPDATE documents SET title = ?, category = ?, subsidiary_id = ? WHERE id = ?',
            [title, category, subId, req.params.id]
        );
        res.json({ message: 'Document updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
