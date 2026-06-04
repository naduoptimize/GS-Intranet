const db = require('./config/db');

const seeds = [
    {
        name: 'George Steuart Aviation',
        description: 'Providing representation for leading international airlines and aviation services.',
        location: 'Colombo 01, Sri Lanka',
        website: 'georgesteuart.lk/george-steuart-aviation',
        email: 'aviation@gs.com',
        phone: '+94 11 234 5678',
        employees: 40
    },
    {
        name: 'Heladiv',
        description: 'A global brand representing the finest quality Ceylon Tea across the world.',
        location: 'Colombo 13, Sri Lanka',
        website: 'georgesteuart.lk/heladiv',
        email: 'heladiv@gs.com',
        phone: '+94 11 244 5566',
        employees: 150
    },
    {
        name: 'Citrus Leisure',
        description: 'Operating premium resorts, city hotels, and leisure properties in Sri Lanka.',
        location: 'Colombo 03, Sri Lanka',
        website: 'citrusleisure.com',
        email: 'info@citrusleisure.com',
        phone: '+94 11 556 6778',
        employees: 500
    },
    {
        name: 'George Steuart Insurance Brokers',
        description: 'Offering comprehensive insurance brokering and risk management services.',
        location: 'Colombo 03, Sri Lanka',
        website: 'gsinsurance.lk',
        email: 'insurance@gs.com',
        phone: '+94 11 255 4319',
        employees: 60
    },
    {
        name: 'George Steuart Asset Management',
        description: 'Providing specialized asset management and financial advisory services.',
        location: 'Colombo 03, Sri Lanka',
        website: 'georgesteuart.lk/george-steuart-asset-management',
        email: 'asset@gs.com',
        phone: '+94 11 255 4319',
        employees: 25
    },
    {
        name: 'George Steuart Consumer',
        description: 'FMCG arm focusing on beverages, personal care, home care, and sanitisers.',
        location: 'Colombo 03, Sri Lanka',
        website: 'georgesteuart.lk/george-steuart-consumer',
        email: 'consumer@gs.com',
        phone: '+94 11 255 4319',
        employees: 200
    },
    {
        name: 'George Steuart Solutions',
        description: 'Industrial solutions providing energy, people movement and AC solutions.',
        location: 'Colombo 03, Sri Lanka',
        website: 'georgesteuart.lk/george-steuart-solutions',
        email: 'solutions@gs.com',
        phone: '+94 11 255 4319',
        employees: 80
    },
    {
        name: 'George Steuart Recruitment',
        description: 'Professional recruitment and talent acquisition services across sectors.',
        location: 'Colombo 03, Sri Lanka',
        website: 'georgesteuart.lk/george-steuart-recruitment',
        email: 'recruitment@gs.com',
        phone: '+94 11 255 4319',
        employees: 30
    }
];

async function run() {
    try {
        console.log('Starting seed...');
        for (const sub of seeds) {
            // Check if exists
            const [rows] = await db.execute('SELECT id FROM subsidiaries WHERE name = ?', [sub.name]);
            if (rows.length === 0) {
                await db.execute(
                    'INSERT INTO subsidiaries (name, description, location, website, email, phone, employees) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [sub.name, sub.description, sub.location, sub.website, sub.email, sub.phone, sub.employees]
                );
                console.log(`Inserted: ${sub.name}`);
            } else {
                console.log(`Skipped (already exists): ${sub.name}`);
            }
        }
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
