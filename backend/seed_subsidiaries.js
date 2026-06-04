const db = require('./config/db');

async function seedSubsidiaries() {
    try {
        // Clear existing subsidiaries
        await db.execute('DELETE FROM subsidiaries');
        await db.execute('ALTER TABLE subsidiaries AUTO_INCREMENT = 1');

        const subs = [
            {
                name: 'George Steuart & Co.',
                desc: 'The oldest mercantile establishment in Sri Lanka, providing strategic direction across a diversified portfolio for over 185 years.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Holding',
                web: 'www.georgesteuart.lk',
                mission: 'To create sustainable value for all stakeholders through a synergy of heritage and modern innovation.',
                vision: 'To lead the nation\'s progress with integrity, resilience, and a commitment to excellence.',
                highlights: 'Founded in 1835; Bedrock of Sri Lankan commerce; Overseeing Healthcare, Tea, Travel, and Finance.',
                img: '/holding_premium.png'
            },
            {
                name: 'George Steuart Health',
                desc: 'A premier distributor of pharmaceuticals and medical equipment, representing over 70 global partners like B Braun and Abbott.',
                loc: 'Colombo 08, Sri Lanka',
                cat: 'Healthcare',
                web: 'www.gshealth.lk',
                mission: 'To successfully deliver globally acceptable health care solutions to every Sri Lankan.',
                vision: 'Towards a happy, healthy and smiling Sri Lanka.',
                highlights: '70+ Global Partners; ISO Certified; Distribution to 5,100+ outlets island-wide.',
                img: '/healthcare_premium.png'
            },
            {
                name: 'George Steuart Insurance',
                desc: 'An independent insurance broker with over 150 years of heritage, providing expert advisory and risk management.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Finance',
                web: 'www.gsinsurance.lk',
                mission: 'To provide independent, professional insurance advisory services that protect the interests of our clients.',
                vision: 'To be the most trusted and expert insurance brokerage in Sri Lanka.',
                highlights: '150+ Years of Heritage; Independent Brokerage; Personal & Corporate Solutions.',
                img: '/insurance_cover.png'
            },
            {
                name: 'George Steuart Invest',
                desc: 'A licensed Interbank Money Dealer specializing in forex and money market consultancy for the banking sector.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Finance',
                web: 'www.georgesteuart.lk',
                mission: 'To facilitate seamless inter-bank transactions and provide expert consultancy in financial markets.',
                vision: 'To be the premier interbank money dealer in Sri Lanka.',
                highlights: 'Licensed by CBSL; Est. 1982; Specialized Forex & Money Market Intermediation.',
                img: '/finance_premium.png'
            },
            {
                name: 'George Steuart Asset Management',
                desc: 'SEC licensed wealth management firm offering strategic discretionary portfolio management for institutional and private clients.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Finance',
                web: 'www.gsam.lk',
                mission: 'To create sustainable wealth through disciplined, strategic investment strategies.',
                vision: 'To be the most trusted name in strategic wealth management.',
                highlights: 'SEC Licensed; Focus on Institutional Funds (EPF/Insurance); HNI Portfolio Management.',
                img: '/finance_cover.png'
            },
            {
                name: 'George Steuart Consumer',
                desc: 'Marketing and distribution arm for FMCG brands, delivering quality home and personal care products island-wide.',
                loc: 'Steuart House, Colombo 03',
                cat: 'FMCG',
                web: 'www.georgesteuart.lk/consumer',
                mission: 'To bring quality consumer products to every household through a robust distribution network.',
                vision: 'To be the fastest-growing FMCG distributor in Sri Lanka.',
                highlights: 'Est. 2021; Distributes Seri Naturals & Heladiv beverages; 12,500+ Retail Outlets.',
                img: '/consumer_cover.png'
            },
            {
                name: 'George Steuart Solutions',
                desc: 'Sustainable engineering and energy solutions provider specializing in Solar PV and innovative climate control systems.',
                loc: 'Colombo 03, Sri Lanka',
                cat: 'Industrial',
                web: 'www.gssolutions.lk',
                mission: 'To provide sustainable and innovative energy and climate solutions for a greener future.',
                vision: 'To lead the industrial sector with eco-friendly and innovative engineering solutions.',
                highlights: 'Solar PV Specialists; Partners with Gree & Mitsubishi; Sustainable Energy Innovation.',
                img: '/industrial_premium.png'
            },
            {
                name: 'George Steuart Recruitment',
                desc: 'Specialized overseas manpower recruitment agency connecting professional Sri Lankan talent with global opportunities.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Services',
                web: 'www.georgesteuart.lk/recruitment',
                mission: 'To connect Sri Lankan talent with global opportunities responsibly and ethically.',
                vision: 'To be the most reliable international recruitment partner in the region.',
                highlights: 'Est. 1986; Strong Middle East Network; ISO Certified Recruitment.',
                img: '/recruitment_premium.png'
            },
            {
                name: 'George Steuart Teas',
                desc: 'The Original Ceylon Tea People. A premier exporter of the finest Pure Ceylon Tea to over 35 global markets.',
                loc: 'Colombo, Sri Lanka',
                cat: 'Export',
                web: 'www.gsteas.lk',
                mission: 'To be a consistent, innovative presence in the beverage industry with a strong affinity to tea-based products.',
                vision: 'To be at the helm of the tea export industry, facilitating the global supply of "Ceylon Tea".',
                highlights: 'Heirs to a legacy dating back to 1835; 35+ Global Markets; Heritage Blends.',
                img: '/tea_export_premium.png'
            },
            {
                name: 'Heladiv (HVA Foods)',
                desc: 'Where Tea Meets Innovation. A global brand known for pioneering tea-based R&D and modern beverage solutions.',
                loc: 'Colombo, Sri Lanka',
                cat: 'FMCG',
                web: 'www.heladiv.com',
                mission: 'To innovate and create tea-based beverages that cater to the evolving tastes of the global consumer.',
                vision: 'To be the world\'s most innovative tea brand, leading with research and sustainability.',
                highlights: 'Ozone-friendly; USDA Organic certified; Pioneer in iced tea and tea-based innovation.',
                img: '/export_cover.png'
            },
            {
                name: 'George Steuart Travels',
                desc: 'A trusted, top-tier travel management partner since 1974, specializing in global outbound corporate travel.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Travel',
                web: 'www.gstravels.lk',
                mission: 'To provide reliable, professional, and comprehensive travel management solutions for the modern traveler.',
                vision: 'To be the most trusted travel partner in Sri Lanka, leveraging centuries of business excellence.',
                highlights: 'Top-tier IATA Agent; Top 3 Outbound Travel Agency; Established in 1974.',
                img: '/travel_premium.png'
            },
            {
                name: 'Steuart Holidays',
                desc: 'The Inbound Travel specialists of the George Steuart group. Expertly showcasing the wonders of Sri Lanka.',
                loc: 'Steuart House, Colombo 03',
                cat: 'Travel',
                web: 'www.steuartholidays.com',
                mission: 'To showcase the beauty of Sri Lanka through bespoke, joyful, and personalized travel experiences.',
                vision: 'To be the premier inbound tour operator, creating unforgettable memories for global explorers.',
                highlights: 'Specialists in Sports Tours; Luxury Holidays; Cultural Excursions.',
                img: '/travel_cover.png'
            },
            {
                name: 'Citrus Leisure',
                desc: 'A leading hospitality brand in Sri Lanka, owning and managing a chain of distinctive hotels and resorts that offer travel experiences like no other.',
                loc: 'Colombo 03, Sri Lanka',
                cat: 'Leisure',
                web: 'www.citrusleisure.com',
                mission: 'To own and manage a chain of distinctive hotels and resorts that exceed guest expectations through the delivery of exceptional, personalized and friendly service, while creating a travel experience like no other.',
                vision: 'To be the ultimate hospitality brand in Sri Lanka.',
                highlights: 'Happiness is Citrus; South Asia\'s tallest revolving restaurant "Blue Orbit"; Waskaduwa, Hikkaduwa & Steuart by Citrus.',
                img: '/citrus_hero.png'
            }
        ];

        for (const sub of subs) {
            await db.execute(
                'INSERT INTO subsidiaries (name, description, location, category, website, email, phone, employees, mission, vision, highlights, cover_image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    sub.name, 
                    sub.desc, 
                    sub.loc, 
                    sub.cat, 
                    sub.web, 
                    `info@${sub.name.toLowerCase().replace(/[^a-z]/g, '')}.com`, 
                    '+94 11 234 5678', 
                    Math.floor(Math.random() * 500) + 100, 
                    sub.mission, 
                    sub.vision, 
                    sub.highlights, 
                    sub.img,
                    'Active'
                ]
            );
        }

        console.log('Subsidiaries seeded with real data successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding subsidiaries:', err);
        process.exit(1);
    }
}

seedSubsidiaries();
