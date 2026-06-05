const axios = require('axios');
const db = require('../backend/config/db');

async function testSync() {
    try {
        console.log('Triggering Microsoft 365 Sync API (POST /api/users/office365/sync)...');
        const res = await axios.post('http://localhost:5000/api/users/office365/sync');
        console.log('Sync Response:', res.data);

        console.log('\nChecking Database counts...');
        const [totalActiveSynced] = await db.execute("SELECT COUNT(*) as count FROM users WHERE is_synced = TRUE AND is_active = TRUE");
        console.log(`Active Synced Users in DB: ${totalActiveSynced[0].count}`);

        const [totalInactiveSynced] = await db.execute("SELECT COUNT(*) as count FROM users WHERE is_synced = TRUE AND is_active = FALSE");
        console.log(`Inactive/Unmatched Synced Users in DB: ${totalInactiveSynced[0].count}`);

        // Get sample synced user
        const [samples] = await db.execute("SELECT id, full_name, email, is_active, is_synced, ignore_sync FROM users WHERE is_synced = TRUE LIMIT 3");
        console.log('\nSample synced users in DB:', samples);

        process.exit(0);
    } catch (err) {
        console.error('Sync test failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

testSync();
