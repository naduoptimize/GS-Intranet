const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');

// Get Unified Exchange Rates for CBSL, Seylan Bank, and Commercial Bank
router.get('/exchange-rates', async (req, res) => {
    try {
        let cbslRate = 328.20;
        let cbslBuy = 326.01;
        let cbslSell = 336.42;
        let isCbslFallback = false;

        // 1. Try to scrape live CBSL Rates
        try {
            const response = await axios.get('https://www.cbsl.gov.lk/cbsl_custom/charts/usd/indexsmall.php', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 4000
            });
            const html = response.data;
            const indicativeMatch = html.match(/Indicative(?:&nbsp;|\s)*([\d.]+)/i);
            const buyMatch = html.match(/Buy(?:&nbsp;|\s)*([\d.]+)/i);
            const sellMatch = html.match(/Sell(?:&nbsp;|\s)*([\d.]+)/i);
            
            if (indicativeMatch) cbslRate = parseFloat(indicativeMatch[1]);
            if (buyMatch) cbslBuy = parseFloat(buyMatch[1]);
            if (sellMatch) cbslSell = parseFloat(sellMatch[1]);
        } catch (scrapeErr) {
            console.error('Failed to scrape live CBSL rates:', scrapeErr.message);
            isCbslFallback = true;
        }

        // 2. Fetch live Commercial Bank Rates
        let combankBuy, combankSell, combankRate;
        let isCombankFallback = false;
        try {
            const combankRes = await axios.get('https://www.combank.lk/api/exchange-rates/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 4000
            });
            const usdRate = combankRes.data.find(c => c.excode === 'USD');
            if (usdRate) {
                combankBuy = parseFloat(usdRate.telegraphic_transfers_buying_rate || usdRate.currency_buying_rate);
                combankSell = parseFloat(usdRate.telegraphic_transfers_selling_rate || usdRate.currency_selling_rate);
                combankRate = (combankBuy + combankSell) / 2;
            } else {
                throw new Error('USD rate not found in ComBank response');
            }
        } catch (combankErr) {
            console.error('Failed to fetch live Commercial Bank rates, using fallback spread:', combankErr.message);
            isCombankFallback = true;
            combankBuy = cbslBuy - 1.25;
            combankSell = cbslSell + 0.85;
            combankRate = (combankBuy + combankSell) / 2;
        }

        // 3. Fetch live Seylan Bank Rates
        let seylanBuy, seylanSell, seylanRate;
        let isSeylanFallback = false;
        try {
            const seylanRes = await axios.get('https://www.seylan.lk/api/exchange-rates-get-value/USD', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 4000
            });
            const usdRate = seylanRes.data?.[0];
            if (usdRate) {
                seylanBuy = parseFloat(usdRate['Telegraphic Transfers Buying'] || usdRate['Currency Notes Buying']);
                seylanSell = parseFloat(usdRate['Telegraphic Transfers Selling'] || usdRate['Currency Notes Selling']);
                seylanRate = (seylanBuy + seylanSell) / 2;
            } else {
                throw new Error('USD rate not found in Seylan response');
            }
        } catch (seylanErr) {
            console.error('Failed to fetch live Seylan Bank rates, using fallback spread:', seylanErr.message);
            isSeylanFallback = true;
            seylanBuy = cbslBuy - 1.50;
            seylanSell = cbslSell + 1.10;
            seylanRate = (seylanBuy + seylanSell) / 2;
        }

        // Base rate for percentage change calculation
        const baseRate = 300.00;
        const cbslChange = (((cbslRate - baseRate) / baseRate) * 100).toFixed(2);
        const combankChange = (((combankRate - baseRate) / baseRate) * 100).toFixed(2);
        const seylanChange = (((seylanRate - baseRate) / baseRate) * 100).toFixed(2);

        res.json({
            cbsl: {
                name: 'Central Bank (CBSL)',
                rate: cbslRate.toFixed(2),
                buy: cbslBuy.toFixed(2),
                sell: cbslSell.toFixed(2),
                change: `${cbslChange >= 0 ? '+' : ''}${cbslChange}%`,
                source: isCbslFallback ? 'Central Bank of Sri Lanka (CBSL - Fallback)' : 'Central Bank of Sri Lanka (CBSL)'
            },
            commercial: {
                name: 'Commercial Bank',
                rate: combankRate.toFixed(2),
                buy: combankBuy.toFixed(2),
                sell: combankSell.toFixed(2),
                change: `${combankChange >= 0 ? '+' : ''}${combankChange}%`,
                source: isCombankFallback ? 'Commercial Bank of Ceylon PLC (Fallback)' : 'Commercial Bank of Ceylon PLC'
            },
            seylan: {
                name: 'Seylan Bank',
                rate: seylanRate.toFixed(2),
                buy: seylanBuy.toFixed(2),
                sell: seylanSell.toFixed(2),
                change: `${seylanChange >= 0 ? '+' : ''}${seylanChange}%`,
                source: isSeylanFallback ? 'Seylan Bank PLC (Fallback)' : 'Seylan Bank PLC'
            }
        });
    } catch (err) {
        console.error('Exchange rates route fatal error:', err);
        res.status(500).json({ message: 'Failed to retrieve exchange rates' });
    }
});

// Legacy /cbsl-rates route for backward compatibility
router.get('/cbsl-rates', async (req, res) => {
    try {
        let cbslRate = 328.20;
        let cbslBuy = 332.09;
        let cbslSell = 342.70;
        try {
            const response = await axios.get('https://www.cbsl.gov.lk/cbsl_custom/charts/usd/indexsmall.php', {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 3000
            });
            const html = response.data;
            const indicativeMatch = html.match(/Indicative(?:&nbsp;|\s)*([\d.]+)/i);
            const buyMatch = html.match(/Buy(?:&nbsp;|\s)*([\d.]+)/i);
            const sellMatch = html.match(/Sell(?:&nbsp;|\s)*([\d.]+)/i);
            if (indicativeMatch) cbslRate = parseFloat(indicativeMatch[1]);
            if (buyMatch) cbslBuy = parseFloat(buyMatch[1]);
            if (sellMatch) cbslSell = parseFloat(sellMatch[1]);
        } catch (e) {}

        res.json({
            rate: cbslRate.toFixed(2),
            buy: cbslBuy.toFixed(2),
            sell: cbslSell.toFixed(2),
            source: 'Central Bank of Sri Lanka (CBSL)'
        });
    } catch (err) {
        res.json({ rate: '328.20', buy: '332.09', sell: '342.70', source: 'CBSL Fallback' });
    }
});


// Get high-level stats for admin dashboard
router.get('/stats', async (req, res) => {
    const { subsidiaryId } = req.query;
    const subId = (subsidiaryId === 'null' || subsidiaryId === 'undefined' || !subsidiaryId) ? null : subsidiaryId;
    console.log('Analytics stats requested with subsidiaryId:', subId);
    
    try {
        let userQuery = 'SELECT COUNT(*) as userCount FROM users WHERE is_active = TRUE';
        let postQuery = 'SELECT COUNT(*) as postCount FROM posts';
        let docQuery = 'SELECT COUNT(*) as docCount FROM documents';
        let params = [];

        if (subId) {
            userQuery += ' AND subsidiary_id = ?';
            postQuery += ' WHERE visibility = "global" OR subsidiary_id = ?';
            docQuery += ' WHERE subsidiary_id IS NULL OR subsidiary_id = ?';
            params = [subId];
        }

        const [[{ userCount }]] = await db.execute(userQuery, params);
        const [[{ postCount }]] = await db.execute(postQuery, params);
        const [[{ docCount }]] = await db.execute(docQuery, params);

        // Subsidiary usage or Department distribution (relevant for super admin vs scoped sub admin)
        let subsidiaryUsage = [];
        if (subId) {
            const [deptUsage] = await db.execute(`
                SELECT IFNULL(NULLIF(department, ''), 'General') as name, COUNT(id) as value 
                FROM users 
                WHERE is_active = TRUE AND subsidiary_id = ?
                GROUP BY department
            `, [subId]);
            subsidiaryUsage = deptUsage;
        } else {
            const [allSubsUsage] = await db.execute(`
                SELECT s.name, COUNT(u.id) as value 
                FROM subsidiaries s 
                LEFT JOIN users u ON s.id = u.subsidiary_id AND u.is_active = TRUE
                GROUP BY s.id
            `);
            subsidiaryUsage = allSubsUsage;
        }

        // Engagement trends (last 7 days)
        const [engagementTrends] = await db.execute(`
            SELECT 
                DATE_FORMAT(dates.date, '%a') as name,
                IFNULL(likes.count, 0) as likes,
                IFNULL(comments.count, 0) as comments
            FROM (
                SELECT CURDATE() as date UNION SELECT CURDATE() - INTERVAL 1 DAY UNION 
                SELECT CURDATE() - INTERVAL 2 DAY UNION SELECT CURDATE() - INTERVAL 3 DAY UNION 
                SELECT CURDATE() - INTERVAL 4 DAY UNION SELECT CURDATE() - INTERVAL 5 DAY UNION 
                SELECT CURDATE() - INTERVAL 6 DAY
            ) dates
            LEFT JOIN (
                SELECT DATE(r.created_at) as date, COUNT(*) as count 
                FROM reactions r
                ${subId ? 'JOIN posts p ON r.post_id = p.id WHERE p.subsidiary_id = ? OR p.visibility = "global"' : ''}
                GROUP BY DATE(r.created_at)
            ) likes ON dates.date = likes.date
            LEFT JOIN (
                SELECT DATE(c.created_at) as date, COUNT(*) as count 
                FROM comments c
                ${subId ? 'JOIN posts p ON c.post_id = p.id WHERE p.subsidiary_id = ? OR p.visibility = "global"' : ''}
                GROUP BY DATE(c.created_at)
            ) comments ON dates.date = comments.date
            ORDER BY dates.date ASC
        `, subId ? [subId, subId] : []);

        res.json({
            userCount,
            postCount,
            docCount,
            subsidiaryUsage,
            engagementTrends
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
