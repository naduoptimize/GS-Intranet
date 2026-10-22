const express = require('express');
const router = express.Router();
const db = require('../config/db');

const ALLOWED_TYPES = new Set(['announcement', 'alert', 'offer']);
const ALLOWED_REACTIONS = new Set(['like', 'appreciate', 'celebrate']);

const ensureTable = () => db.execute(`
  CREATE TABLE IF NOT EXISTS communication_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type VARCHAR(20) NOT NULL,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_communication_reaction (item_type, item_id, user_id),
    INDEX idx_communication_item (item_type, item_id),
    INDEX idx_communication_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
`);

router.get('/reactions', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ message: 'Valid user_id is required' });
  try {
    await ensureTable();
    const [postRows] = await db.execute(`
      SELECT 'announcement' AS item_type, post_id AS item_id, COUNT(*) AS reaction_count,
        GROUP_CONCAT(DISTINCT type) AS reaction_types,
        MAX(CASE WHEN user_id = ? THEN type END) AS user_reaction
      FROM reactions GROUP BY post_id
    `, [userId]);
    const [communicationRows] = await db.execute(`
      SELECT item_type, item_id, COUNT(*) AS reaction_count,
        GROUP_CONCAT(DISTINCT reaction_type) AS reaction_types,
        MAX(CASE WHEN user_id = ? THEN reaction_type END) AS user_reaction
      FROM communication_reactions GROUP BY item_type, item_id
    `, [userId]);
    res.json([...postRows, ...communicationRows]);
  } catch (error) {
    console.error('Error loading communication reactions:', error);
    res.status(500).json({ message: 'Could not load reactions' });
  }
});

router.get('/:itemType/:id/reactions', async (req, res) => {
  const { itemType } = req.params;
  const itemId = Number(req.params.id);
  if (!ALLOWED_TYPES.has(itemType) || !itemId) {
    return res.status(400).json({ message: 'Invalid communication item' });
  }

  try {
    let rows;
    if (itemType === 'announcement') {
      [rows] = await db.execute(`
        SELECT r.type AS reaction_type, r.created_at, u.id AS user_id,
          u.full_name, u.profile_pic, u.job_title, s.name AS subsidiary_name
        FROM reactions r
        JOIN users u ON u.id = r.user_id
        LEFT JOIN subsidiaries s ON s.id = u.subsidiary_id
        WHERE r.post_id = ?
        ORDER BY r.created_at DESC
      `, [itemId]);
    } else {
      await ensureTable();
      [rows] = await db.execute(`
        SELECT r.reaction_type, r.created_at, u.id AS user_id,
          u.full_name, u.profile_pic, u.job_title, s.name AS subsidiary_name
        FROM communication_reactions r
        JOIN users u ON u.id = r.user_id
        LEFT JOIN subsidiaries s ON s.id = u.subsidiary_id
        WHERE r.item_type = ? AND r.item_id = ?
        ORDER BY r.created_at DESC
      `, [itemType, itemId]);
    }
    res.json(rows);
  } catch (error) {
    console.error('Error loading reaction details:', error);
    res.status(500).json({ message: 'Could not load reaction details' });
  }
});

router.post('/:itemType/:id/react', async (req, res) => {
  const { itemType } = req.params;
  const itemId = Number(req.params.id);
  const userId = Number(req.body.user_id);
  const reactionType = req.body.reaction_type || 'like';
  if (!ALLOWED_TYPES.has(itemType) || !itemId || !userId || !ALLOWED_REACTIONS.has(reactionType)) {
    return res.status(400).json({ message: 'Invalid reaction request' });
  }
  try {
    if (itemType === 'announcement') {
      const [existing] = await db.execute('SELECT type FROM reactions WHERE post_id = ? AND user_id = ?', [itemId, userId]);
      if (existing[0]?.type === reactionType) await db.execute('DELETE FROM reactions WHERE post_id = ? AND user_id = ?', [itemId, userId]);
      else if (existing.length) await db.execute('UPDATE reactions SET type = ? WHERE post_id = ? AND user_id = ?', [reactionType, itemId, userId]);
      else await db.execute('INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, ?)', [itemId, userId, reactionType]);
      const [summary] = await db.execute('SELECT COUNT(*) AS reaction_count, GROUP_CONCAT(DISTINCT type) AS reaction_types, MAX(CASE WHEN user_id = ? THEN type END) AS user_reaction FROM reactions WHERE post_id = ?', [userId, itemId]);
      return res.json(summary[0]);
    }

    await ensureTable();
    const targetTable = itemType === 'alert' ? 'alerts' : 'offers';
    const [target] = await db.execute(`SELECT id FROM ${targetTable} WHERE id = ?`, [itemId]);
    if (!target.length) return res.status(404).json({ message: 'Communication item not found' });
    const [existing] = await db.execute('SELECT reaction_type FROM communication_reactions WHERE item_type = ? AND item_id = ? AND user_id = ?', [itemType, itemId, userId]);
    if (existing[0]?.reaction_type === reactionType) await db.execute('DELETE FROM communication_reactions WHERE item_type = ? AND item_id = ? AND user_id = ?', [itemType, itemId, userId]);
    else if (existing.length) await db.execute('UPDATE communication_reactions SET reaction_type = ? WHERE item_type = ? AND item_id = ? AND user_id = ?', [reactionType, itemType, itemId, userId]);
    else await db.execute('INSERT INTO communication_reactions (item_type, item_id, user_id, reaction_type) VALUES (?, ?, ?, ?)', [itemType, itemId, userId, reactionType]);
    const [summary] = await db.execute('SELECT COUNT(*) AS reaction_count, GROUP_CONCAT(DISTINCT reaction_type) AS reaction_types, MAX(CASE WHEN user_id = ? THEN reaction_type END) AS user_reaction FROM communication_reactions WHERE item_type = ? AND item_id = ?', [userId, itemType, itemId]);
    res.json(summary[0]);
  } catch (error) {
    console.error('Error saving communication reaction:', error);
    res.status(500).json({ message: 'Could not save reaction' });
  }
});

module.exports = router;
