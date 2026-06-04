const axios = require('axios');

async function testApi() {
    try {
        console.log('Testing Exchange Rates API endpoint...');
        const response = await axios.get('http://localhost:5000/api/analytics/exchange-rates');
        console.log('Status Code:', response.status);
        console.log('Response JSON:\n', JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('API request failed:', e.message);
    }
}

testApi();
