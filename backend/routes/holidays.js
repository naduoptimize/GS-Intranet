const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all holidays
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM holidays WHERE is_active = TRUE ORDER BY holiday_date ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a holiday (Admin only ideally, but role check done on frontend for now)
router.post('/', async (req, res) => {
    const { name, holiday_date, type } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO holidays (name, holiday_date, type) VALUES (?, ?, ?)',
            [name, holiday_date, type]
        );
        res.status(201).json({ id: result.insertId, message: 'Holiday added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a holiday
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, holiday_date, type } = req.body;
    try {
        await db.execute(
            'UPDATE holidays SET name = ?, holiday_date = ?, type = ? WHERE id = ?',
            [name, holiday_date, type, id]
        );
        res.json({ message: 'Holiday updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a holiday (Soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('UPDATE holidays SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const pdfPathFile = path.join(__dirname, '../uploads/holiday_pdf.json');

// Helper to parse PDF and insert/update holidays in database automatically
async function extractHolidaysFromPdf(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('PDF file does not exist at:', filePath);
        return [];
    }
    const dataBuffer = fs.readFileSync(filePath);
    const pdfParser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const pdfData = await pdfParser.getText();
    const text = pdfData.text;
    
    // Detect default year from the full text of the document
    let defaultYear = new Date().getFullYear();
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
        defaultYear = parseInt(yearMatch[1], 10);
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const foundHolidays = [];

    const monthMap = {
        jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
        apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
        aug: '08', august: '08', sep: '09', september: '09', oct: '10', october: '10',
        nov: '11', november: '11', dec: '12', december: '12'
    };

    for (const rawLine of lines) {
        // Remove ordinal suffixes like 1st, 2nd, 3rd, 4th, etc.
        const line = rawLine.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');
        
        let dateStr = '';
        let matchedSub = '';

        // 1. YYYY-MM-DD or YYYY/MM/DD
        let m = line.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
        if (m) {
            dateStr = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
            matchedSub = m[0];
        }
        
        // 2. DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
        if (!dateStr) {
            m = line.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
            if (m) {
                dateStr = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
                matchedSub = m[0];
            }
        }

        // 3. DD Month YYYY or DD Month
        if (!dateStr) {
            m = line.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(20\d{2}))?\b/i);
            if (m) {
                const year = m[3] ? m[3] : defaultYear;
                const month = monthMap[m[2].toLowerCase().substring(0, 3)];
                const day = m[1].padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
                matchedSub = m[0];
            }
        }

        // 4. Month DD YYYY or Month DD
        if (!dateStr) {
            m = line.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:\s+(20\d{2}))?\b/i);
            if (m) {
                const year = m[3] ? m[3] : defaultYear;
                const month = monthMap[m[1].toLowerCase().substring(0, 3)];
                const day = m[2].padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
                matchedSub = m[0];
            }
        }

        if (dateStr) {
            // Extract and clean name
            let name = line.replace(matchedSub, '');
            
            // Remove common day names
            name = name.replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, '');
            
            // Strip text like "(Group Holiday)" or "(Poya Holiday)" or "(Public Holiday)" or "(Mercantile Holiday)"
            name = name.replace(/\((?:Public|Poya|Mercantile|Group|Bank)?\s*Holiday\)/gi, '').trim();
            name = name.replace(/\(\s*\)/g, '').trim();
            // Clean up separators
            name = name.replace(/^[:\s\-–—+|()\[\]*#]+/g, '').replace(/[:\s\-–—+|()\[\]*#]+$/g, '').trim();
            
            if (name.length < 3) continue;

            // Determine type
            let type = 'Public';
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('poya')) {
                type = 'Poya';
            } else if (lowerLine.includes('mercantile')) {
                type = 'Mercantile';
            } else if (lowerLine.includes('group')) {
                type = 'Group';
            } else if (lowerLine.includes('public')) {
                type = 'Public';
            }
            
            // Capitalize name beautifully
            name = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            
            foundHolidays.push({ name, date: dateStr, type });
        }
    }

    // Save to DB
    let addedCount = 0;
    let updatedCount = 0;
    for (const h of foundHolidays) {
        try {
            const [existing] = await db.execute(
                'SELECT id FROM holidays WHERE holiday_date = ? AND is_active = TRUE',
                [h.date]
            );
            if (existing.length > 0) {
                await db.execute(
                    'UPDATE holidays SET name = ?, type = ? WHERE id = ?',
                    [h.name, h.type, existing[0].id]
                );
                updatedCount++;
            } else {
                await db.execute(
                    'INSERT INTO holidays (name, holiday_date, type) VALUES (?, ?, ?)',
                    [h.name, h.date, h.type]
                );
                addedCount++;
            }
        } catch (dbErr) {
            console.error('Failed to insert parsed holiday:', h, dbErr);
        }
    }

    console.log(`PDF Parsed successfully: Added ${addedCount}, Updated ${updatedCount} holidays.`);
    return foundHolidays;
}

// Get Holiday PDF URL
router.get('/pdf', (req, res) => {
    try {
        if (fs.existsSync(pdfPathFile)) {
            const data = fs.readFileSync(pdfPathFile, 'utf8');
            return res.json(JSON.parse(data));
        }
        res.json({ pdfUrl: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Holiday PDF URL & Auto-parse holidays
router.post('/pdf', async (req, res) => {
    const { pdfUrl } = req.body;
    try {
        const dir = path.dirname(pdfPathFile);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(pdfPathFile, JSON.stringify({ pdfUrl }), 'utf8');

        // Extract filename from pdfUrl and run auto-parsing
        let parsedHolidays = [];
        try {
            const filename = path.basename(pdfUrl);
            const localPdfPath = path.join(__dirname, '../uploads', filename);
            parsedHolidays = await extractHolidaysFromPdf(localPdfPath);
        } catch (parseErr) {
            console.error('Auto-parsing of PDF failed:', parseErr);
        }

        res.json({ 
            message: 'Holiday PDF updated and parsed successfully', 
            pdfUrl, 
            parsedCount: parsedHolidays.length 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

