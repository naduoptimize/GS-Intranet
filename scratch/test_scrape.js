const axios = require('axios');

async function testScrape() {
    console.log('--- TESTING CBSL ---');
    try {
        const cbsl = await axios.get('https://www.cbsl.gov.lk/cbsl_custom/charts/usd/indexsmall.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        console.log('CBSL status:', cbsl.status);
        console.log('CBSL match buy:', cbsl.data.match(/Buy(?:&nbsp;|\s)*([\d.]+)/i)?.[0]);
        console.log('CBSL match sell:', cbsl.data.match(/Sell(?:&nbsp;|\s)*([\d.]+)/i)?.[0]);
    } catch (e) {
        console.log('CBSL error:', e.message);
    }

    console.log('\n--- TESTING COMMERCIAL BANK ---');
    try {
        const combank = await axios.get('https://www.combank.lk', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        console.log('Commercial Bank status:', combank.status);
        // Look for USD rates
        const html = combank.data;
        console.log('Commercial Bank contains USD?', html.includes('USD'));
        const usdPos = html.indexOf('USD');
        if (usdPos !== -1) {
            console.log('USD snippet:', html.substring(usdPos, usdPos + 200));
        }
    } catch (e) {
        console.log('Commercial Bank error:', e.message);
    }

    console.log('\n--- TESTING SEYLAN BANK ---');
    try {
        const seylan = await axios.get('https://www.seylan.lk', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        console.log('Seylan Bank status:', seylan.status);
        const html = seylan.data;
        console.log('Seylan Bank contains USD?', html.includes('USD'));
        const usdPos = html.indexOf('USD');
        if (usdPos !== -1) {
            console.log('USD snippet:', html.substring(usdPos, usdPos + 200));
        }
    } catch (e) {
        console.log('Seylan Bank error:', e.message);
    }
}

testScrape();
