const db = require('./config/db');

async function seedHolidays2026() {
    try {
        // Clear existing holidays for 2026 if any
        await db.execute("DELETE FROM holidays WHERE holiday_date LIKE '2026%'");
        console.log('Cleared existing 2026 holidays.');

        const holidays = [
            { name: 'Duruthu Full Moon Poya Day', date: '2026-01-03', type: 'Poya' },
            { name: 'Tamil Thai Pongal Day', date: '2026-01-15', type: 'Public' },
            { name: 'Nawam Full Moon Poya Day', date: '2026-02-01', type: 'Poya' },
            { name: 'Independence Day', date: '2026-02-04', type: 'Public' },
            { name: 'Madin Full Moon Poya Day', date: '2026-03-02', type: 'Poya' },
            { name: 'Bak Full Moon Poya Day', date: '2026-04-01', type: 'Poya' },
            { name: 'Day Prior to Sinhala & Tamil New Year Day', date: '2026-04-13', type: 'Public' },
            { name: 'Sinhala & Tamil New Year Day', date: '2026-04-14', type: 'Public' },
            { name: 'Additional Half-Holiday in Lieu of Day Following Vesak Full Moon Poya Day', date: '2026-04-30', type: 'Mercantile' },
            { name: 'May Day / Vesak Full Moon Poya Day', date: '2026-05-01', type: 'Poya' },
            { name: 'Day Following Vesak Full Moon Poya Day', date: '2026-05-02', type: 'Public' },
            { name: 'Adhi Poson Full Moon Poya Day', date: '2026-05-30', type: 'Poya' },
            { name: 'Poson Full Moon Poya Day', date: '2026-06-29', type: 'Poya' },
            { name: 'Esala Full Moon Poya Day', date: '2026-07-29', type: 'Poya' },
            { name: 'Holy Prophet’s Birthday (Milad-Un-Nabi)', date: '2026-08-26', type: 'Public' },
            { name: 'Nikini Full Moon Poya Day', date: '2026-08-27', type: 'Poya' },
            { name: 'Binara Full Moon Poya Day', date: '2026-09-26', type: 'Poya' },
            { name: 'Vap Full Moon Poya Day', date: '2026-10-25', type: 'Poya' },
            { name: 'Ill Full Moon Poya Day', date: '2026-11-24', type: 'Poya' },
            { name: 'Unduvap Full Moon Poya Day', date: '2026-12-23', type: 'Poya' },
            { name: 'Christmas Eve (Half Day)', date: '2026-12-24', type: 'Mercantile' },
            { name: 'Christmas Day', date: '2026-12-25', type: 'Public' },
            { name: 'Boxing Day', date: '2026-12-26', type: 'Public' }
        ];

        for (const holiday of holidays) {
            await db.execute(
                'INSERT INTO holidays (name, holiday_date, type) VALUES (?, ?, ?)',
                [holiday.name, holiday.date, holiday.type]
            );
            console.log(`Added: ${holiday.name} on ${holiday.date}`);
        }

        console.log('Successfully seeded 2026 holidays.');
    } catch (err) {
        console.error('Error seeding holidays:', err);
    } finally {
        process.exit();
    }
}

seedHolidays2026();
