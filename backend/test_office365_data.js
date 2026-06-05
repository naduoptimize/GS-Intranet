const axios = require('axios');
require('dotenv').config();

async function test() {
    try {
        console.log('Fetching users from local office365 endpoint...');
        const res = await axios.get('http://localhost:5000/api/users/office365');
        const users = res.data;
        console.log(`Total users returned: ${users.length}`);

        const companyCounts = {};
        let nullCount = 0;
        let undefinedCount = 0;
        let emptyCount = 0;

        users.forEach(u => {
            const name = u.subsidiary_name;
            if (name === null) nullCount++;
            else if (name === undefined) undefinedCount++;
            else if (name.trim() === '') emptyCount++;
            else {
                companyCounts[name] = (companyCounts[name] || 0) + 1;
            }
        });

        console.log('\nSubsidiary Name Counts:');
        console.log(companyCounts);
        console.log(`Null count: ${nullCount}`);
        console.log(`Undefined count: ${undefinedCount}`);
        console.log(`Empty string count: ${emptyCount}`);

        process.exit(0);
    } catch (e) {
        console.error('Test failed:', e.message);
        process.exit(1);
    }
}

test();
