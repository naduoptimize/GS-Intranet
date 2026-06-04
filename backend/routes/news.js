const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../utils/notifications');

function parseRSS(xmlText) {
    const items = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    if (!itemMatches) return items;

    for (const itemXml of itemMatches) {
        let title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
        title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        title = title.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                     .replace(/&amp;/g, '&').replace(/&#8217;/g, "'")
                     .replace(/&#8211;/g, "–").replace(/&#8220;/g, '"')
                     .replace(/&#8221;/g, '"');

        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';

        let description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
        description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        let cleanDescription = description.replace(/<[^>]*>/g, '').trim();
        cleanDescription = cleanDescription
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#8217;/g, "'")
            .replace(/&#8211;/g, "–")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"');

        const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
        
        let thumbnail = '';
        
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/);
        if (enclosureMatch) {
            thumbnail = enclosureMatch[1];
        }
        
        if (!thumbnail) {
            const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/);
            if (mediaMatch) {
                thumbnail = mediaMatch[1];
            }
        }
        
        if (!thumbnail) {
            const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
                thumbnail = imgMatch[1];
            }
        }

        if (!thumbnail) {
            thumbnail = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600';
        }

        items.push({
            title: title.trim(),
            link: link.trim(),
            description: cleanDescription.substring(0, 120) + (cleanDescription.length > 120 ? '...' : ''),
            source: 'Ada Derana Business',
            pubDate: pubDateStr,
            thumbnail: thumbnail
        });
    }

    return items;
}

// Get external RSS feed
router.get('/external-feed', async (req, res) => {
    try {
        const feedUrl = 'http://bizenglish.adaderana.lk/feed';
        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }
        const xmlText = await response.text();
        const newsItems = parseRSS(xmlText);
        res.json(newsItems);
    } catch (err) {
        console.error('Error fetching RSS news feed:', err);
        const fallbackNews = [
            {
                title: 'Sri Lankan Rupee continues to strengthen against major currencies',
                link: 'http://bizenglish.adaderana.lk/',
                description: 'The Central Bank of Sri Lanka reports a steady appreciation of the Sri Lankan Rupee against the US Dollar and other key currencies.',
                source: 'Ada Derana Business (Fallback)',
                pubDate: new Date().toUTCString(),
                thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600'
            },
            {
                title: 'George Steuart Group announces Q1 strategic expansion',
                link: 'http://bizenglish.adaderana.lk/',
                description: 'George Steuart Group reveals new initiatives targeting digital workspace modernization and automation integration across operations.',
                source: 'GS Corporate Communications (Fallback)',
                pubDate: new Date().toUTCString(),
                thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600'
            },
            {
                title: 'Colombo Stock Exchange closes with significant retail gains',
                link: 'http://bizenglish.adaderana.lk/',
                description: 'The ASPI and S&P SL20 show major upward movements as market turnover rises following corporate quarterly earnings announcements.',
                source: 'Ada Derana Business (Fallback)',
                pubDate: new Date().toUTCString(),
                thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600'
            }
        ];
        res.json(fallbackNews);
    }
});

// Get all news
router.get('/', async (req, res) => {
    const { subsidiaryId, role } = req.query;
    try {
        let query = 'SELECT n.*, s.name as subsidiary_name FROM news n LEFT JOIN subsidiaries s ON n.subsidiary_id = s.id WHERE n.is_active = 1';
        let params = [];

        if (role !== 'super_admin') {
            query += ' AND (n.subsidiary_id IS NULL OR n.subsidiary_id = ?)';
            params.push(subsidiaryId || null);
        }

        query += ' ORDER BY n.publish_date DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add news
router.post('/', async (req, res) => {
    const { title, content, image_url, category, publish_date, subsidiary_id } = req.body;
    try {
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        const [result] = await db.execute(
            'INSERT INTO news (title, content, image_url, category, publish_date, subsidiary_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, content, image_url, category, publish_date, subId]
        );

        // Send notifications
        await createNotification({
            type: 'news',
            message: `New article published: ${title}`,
            link: '/news',
            subsidiary_id: subId
        });

        res.status(201).json({ id: result.insertId, message: 'News added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update news
router.put('/:id', async (req, res) => {
    const { title, content, image_url, category, publish_date, subsidiary_id } = req.body;
    try {
        const subId = subsidiary_id === 'null' || !subsidiary_id ? null : subsidiary_id;
        await db.execute(
            'UPDATE news SET title = ?, content = ?, image_url = ?, category = ?, publish_date = ?, subsidiary_id = ? WHERE id = ?',
            [title, content, image_url, category, publish_date, subId, req.params.id]
        );
        res.json({ message: 'News updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete news (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('UPDATE news SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
