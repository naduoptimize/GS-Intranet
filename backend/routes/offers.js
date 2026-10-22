const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');
const { isSuperOrGroupAdmin, isSubAdmin } = require('../utils/roles');

// GET all offers (with role/subsidiary filtering)
router.get('/', async (req, res) => {
    const { role, subsidiary_id } = req.query;

    let query = `
        SELECT o.*, s.name as subsidiary_name 
        FROM offers o 
        LEFT JOIN subsidiaries s ON o.subsidiary_id = s.id
    `;
    let queryParams = [];

    if (isSuperOrGroupAdmin(role)) {
        // Super Admin and Group Admin can view all offers or filter by specific subsidiary
        if (subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '' && subsidiary_id !== 'all') {
            query += ' WHERE o.subsidiary_id = ?';
            queryParams.push(subsidiary_id);
        }
    } else if (isSubAdmin(role)) {
        // Sub Admin sees global offers + their own subsidiary's offers
        const subId = subsidiary_id || req.user?.subsidiary_id;
        if (subId && subId !== 'null' && subId !== 'undefined' && subId !== '') {
            query += ' WHERE o.subsidiary_id IS NULL OR o.subsidiary_id = ?';
            queryParams.push(subId);
        } else {
            query += ' WHERE o.subsidiary_id IS NULL';
        }
    } else {
        // Employee: only sees global offers OR offers belonging to their subsidiary
        if (subsidiary_id && subsidiary_id !== 'null' && subsidiary_id !== 'undefined' && subsidiary_id !== '') {
            query += ' WHERE o.subsidiary_id IS NULL OR o.subsidiary_id = ?';
            queryParams.push(subsidiary_id);
        } else {
            query += ' WHERE o.subsidiary_id IS NULL';
        }
    }

    query += ' ORDER BY o.created_at DESC';

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
    const { 
        category, badge, title, description, cta, gradient, emoji, 
        image_url, valid_until, savings, subsidiary_id, role, user_subsidiary_id 
    } = req.body;

    let targetSubId = subsidiary_id;

    if (isSubAdmin(role)) {
        // Subadmin must assign to their own subsidiary
        targetSubId = user_subsidiary_id || subsidiary_id;
        if (!targetSubId || targetSubId === 'null') {
            return res.status(400).json({ message: 'Sub Admin must specify a valid subsidiary' });
        }
    } else if (isSuperOrGroupAdmin(role)) {
        // Super/Group admin can make it global (null) or pick subsidiary
        if (targetSubId === 'null' || targetSubId === 'global' || targetSubId === '' || !targetSubId) {
            targetSubId = null;
        }
    } else {
        return res.status(403).json({ message: 'Employees are not authorized to create offers' });
    }

    const query = `
        INSERT INTO offers 
        (category, badge, title, description, cta, gradient, emoji, image_url, valid_until, savings, subsidiary_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        category || 'General',
        badge || 'Special',
        title,
        description,
        cta || 'Claim Perk',
        gradient || 'from-sky-500 via-cyan-400 to-teal-500',
        emoji || '🎁',
        image_url || null,
        valid_until || 'Ongoing Benefit',
        savings || (badge || 'Exclusive'),
        targetSubId
    ];

    try {
        const [result] = await db.execute(query, values);

        // Send notifications
        await createNotification({
            type: 'offer',
            message: `New benefit offer: ${title}`,
            link: '/offers',
            subsidiary_id: targetSubId
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
    const { 
        category, badge, title, description, cta, gradient, emoji, 
        image_url, valid_until, savings, subsidiary_id, role, user_subsidiary_id 
    } = req.body;

    try {
        if (isSubAdmin(role)) {
            // Check offer ownership
            const [offerRows] = await db.execute('SELECT subsidiary_id FROM offers WHERE id = ?', [id]);
            if (offerRows.length === 0) return res.status(404).json({ message: 'Offer not found' });
            if (Number(offerRows[0].subsidiary_id) !== Number(user_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to update offer from another subsidiary' });
            }
        }

        let targetSubId = subsidiary_id;
        if (isSubAdmin(role)) {
            targetSubId = user_subsidiary_id;
        } else if (targetSubId === 'null' || targetSubId === 'global' || targetSubId === '' || !targetSubId) {
            targetSubId = null;
        }

        const query = `
            UPDATE offers 
            SET category = ?, badge = ?, title = ?, description = ?, cta = ?, gradient = ?, emoji = ?, image_url = ?, valid_until = ?, savings = ?, subsidiary_id = ?
            WHERE id = ?
        `;
        const values = [
            category || 'General',
            badge || 'Special',
            title,
            description,
            cta || 'Claim Perk',
            gradient || 'from-sky-500 via-cyan-400 to-teal-500',
            emoji || '🎁',
            image_url || null,
            valid_until || 'Ongoing Benefit',
            savings || (badge || 'Exclusive'),
            targetSubId,
            id
        ];

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
    const { role, user_subsidiary_id } = req.query;

    try {
        if (isSubAdmin(role)) {
            const [offerRows] = await db.execute('SELECT subsidiary_id FROM offers WHERE id = ?', [id]);
            if (offerRows.length === 0) return res.status(404).json({ message: 'Offer not found' });
            if (Number(offerRows[0].subsidiary_id) !== Number(user_subsidiary_id)) {
                return res.status(403).json({ message: 'Not authorized to delete offer from another subsidiary' });
            }
        }

        const [result] = await db.execute('DELETE FROM offers WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json({ message: 'Offer deleted successfully' });
    } catch (err) {
        console.error('Error deleting offer:', err);
        res.status(500).json({ message: 'Error deleting offer' });
    }
});

module.exports = router;
