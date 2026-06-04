const db = require('../config/db');

/**
 * Creates notifications for target users.
 * @param {Object} params
 * @param {string} params.type - The type of notification ('document', 'news', 'offer', 'post', 'alert', 'memory')
 * @param {string} params.message - The notification message text
 * @param {string} params.link - The URL link for the notification redirect
 * @param {number|null} params.subsidiary_id - The subsidiary ID if scoped, or null/undefined if global
 * @param {number|null} [params.exclude_user_id] - Optional user ID to exclude (e.g. the creator)
 */
async function createNotification({ type, message, link, subsidiary_id, exclude_user_id }) {
    try {
        let query = 'SELECT id FROM users WHERE is_active = 1';
        let params = [];

        const subId = (subsidiary_id === 'null' || !subsidiary_id) ? null : parseInt(subsidiary_id, 10);

        if (subId) {
            query += ' AND subsidiary_id = ?';
            params.push(subId);
        }

        if (exclude_user_id) {
            query += ' AND id != ?';
            params.push(parseInt(exclude_user_id, 10));
        }

        const [users] = await db.execute(query, params);

        if (users && users.length > 0) {
            const insertQuery = 'INSERT INTO notifications (user_id, type, message, link, is_read) VALUES ?';
            const values = users.map(user => [user.id, type, message, link, 0]);
            await db.query(insertQuery, [values]);
            console.log(`Created ${users.length} notifications of type "${type}"`);
        }
    } catch (err) {
        console.error('Error creating notifications:', err);
    }
}

module.exports = {
    createNotification
};
