const db = require('./config/db');

const directorsData = {
    'Health': [
        { name: 'Eran Ranasinghe', role: 'Managing Director' },
        { name: 'Sarva Ameresekere', role: 'Group Chairman' },
        { name: 'Thulitha Jayasooriya', role: 'Director' },
        { name: 'Sanjiva Wijesekera', role: 'Director' },
        { name: 'Thushantha Nakandala', role: 'Director' },
        { name: 'Varuni Fernando', role: 'Director' },
        { name: 'Ashika Karunathilaka', role: 'Director' },
        { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Insurance': [
        { name: 'Joachim Caspersz', role: 'Managing Director' },
        { name: 'T S Arulanandan', role: 'Director' },
        { name: 'Kumar Muthiah', role: 'Director' },
        { name: 'Rohana Weerasinghe', role: 'Director' },
        { name: 'Sarva Ameresekere', role: 'Director' },
        { name: 'Varuni Fernando', role: 'Director' },
        { name: 'Ashika Karunathilaka', role: 'Director' },
        { name: 'Manoj Pilimatalawwe', role: 'Director' },
        { name: 'Dharani Fernando', role: 'Director' }
    ],
    'Asset': [
        { name: 'Sudath De Silva', role: 'Managing Director' },
        { name: 'Manoj Pilimatalawwe', role: 'Director' },
        { name: 'Harsha Fernando', role: 'Director' },
        { name: 'Vasula Premawardhana', role: 'Director' },
        { name: 'W.A.A. Perera', role: 'Director' },
        { name: 'P.N. Mahawatte', role: 'Director' }
    ],
    'Consumer': [
        { name: 'Tharanga Wickramasinghe', role: 'Executive Director / CEO' },
        { name: 'Sarva Ameresekere', role: 'Director' },
        { name: 'Varuni Fernando', role: 'Director' },
        { name: 'Ashika Karunathilaka', role: 'Director' },
        { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Solutions': [
        { name: 'Manoj Pilimatalawwe', role: 'Executive Director / Lead' },
        { name: 'Sarva Ameresekere', role: 'Director' },
        { name: 'Varuni Fernando', role: 'Director' },
        { name: 'Ashika Karunathilaka', role: 'Director' }
    ],
    'Recruitment': [
        { name: 'Amila Rajapaksha', role: 'Executive Director / General Manager' },
        { name: 'R.M. Rahaman', role: 'Executive Director' },
        { name: 'Sarva Ameresekere', role: 'Director' },
        { name: 'Varuni Fernando', role: 'Director' },
        { name: 'Ashika Karunathilaka', role: 'Director' },
        { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Citrus': [
        { name: 'Chandana Talwatte', role: 'Executive Director / CEO' },
        { name: 'Mani Sugathapala', role: 'Executive Director (Sales & Marketing)' },
        { name: 'Varuni Fernando', role: 'Non-Executive Director' },
        { name: 'Sarva Amarasekere', role: 'Non-Executive Director' }
    ],
    'Heladiv': [
        { name: 'Sarva Ameresekere', role: 'Group Chairman' },
        { name: 'Charith Abeywardena', role: 'Director / CEO' },
        { name: 'V. S. A. Senadheera', role: 'Director' }
    ],
    'Invest': [
       { name: 'Sudath De Silva', role: 'Executive Director' },
       { name: 'Sarva Ameresekere', role: 'Director' },
       { name: 'Varuni Fernando', role: 'Director' },
       { name: 'Ashika Karunathilaka', role: 'Director' },
       { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Teas': [
       { name: 'Dai Pathmanathan', role: 'Managing Director' },
       { name: 'Sarva Ameresekere', role: 'Group Chairman' },
       { name: 'Varuni Fernando', role: 'Director' },
       { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Travels': [
       { name: 'Channe Wijemanne', role: 'Managing Director' },
       { name: 'Sarva Ameresekere', role: 'Director' },
       { name: 'Varuni Fernando', role: 'Director' },
       { name: 'Ashika Karunathilaka', role: 'Director' },
       { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ],
    'Holiday': [
       { name: 'Channe Wijemanne', role: 'Managing Director' },
       { name: 'Sarva Ameresekere', role: 'Director' },
       { name: 'Varuni Fernando', role: 'Director' },
       { name: 'Ashika Karunathilaka', role: 'Director' },
       { name: 'Manoj Pilimatalawwe', role: 'Director' }
    ]
};

async function run() {
    try {
        console.log('Starting directors seed...');
        const [subs] = await db.execute('SELECT * FROM subsidiaries');
        
        for (const sub of subs) {
            const lowName = sub.name.toLowerCase();
            let key = null;
            
            if (lowName.includes('health') || lowName.includes('pharmaceutical')) key = 'Health';
            else if (lowName.includes('insurance')) key = 'Insurance';
            else if (lowName.includes('asset')) key = 'Asset';
            else if (lowName.includes('consumer')) key = 'Consumer';
            else if (lowName.includes('solutions')) key = 'Solutions';
            else if (lowName.includes('recruitment')) key = 'Recruitment';
            else if (lowName.includes('citrus')) key = 'Citrus';
            else if (lowName.includes('heladiv')) key = 'Heladiv';
            else if (lowName.includes('invest')) key = 'Invest';
            else if (lowName.includes('teas') && !lowName.includes('heladiv')) key = 'Teas';
            else if (lowName.includes('travel')) key = 'Travels';
            else if (lowName.includes('holiday')) key = 'Holiday';

            if (key && directorsData[key]) {
                const directors = directorsData[key];
                
                // check if directors exist
                const [existing] = await db.execute('SELECT id FROM subsidiary_directors WHERE subsidiary_id = ?', [sub.id]);
                if (existing.length === 0) {
                    for (const dir of directors) {
                        await db.execute(
                            'INSERT INTO subsidiary_directors (subsidiary_id, name, title) VALUES (?, ?, ?)',
                            [sub.id, dir.name, dir.role]
                        );
                    }
                    console.log(`Inserted ${directors.length} directors for ${sub.name}`);
                } else {
                    console.log(`Skipped (directors already exist) for ${sub.name}`);
                }
            } else {
                console.log(`No hardcoded directors found for ${sub.name}`);
            }
        }
        console.log('Done seeding directors!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
