const db = require('../config/db');

async function syncAllAzureSubsidiaries() {
    try {
        console.log('--- Step 1: Checking and creating missing Azure subsidiaries in subsidiaries table ---');

        const entitiesToEnsure = [
            {
                name: 'George Steuart Optimize (Pvt) Ltd',
                category: 'IT & Digital',
                description: 'The technology, software engineering, and digital transformation arm of the George Steuart Group.',
                location: 'Steuart House, Colombo 03',
                website: 'www.gsoptimize.lk',
                email: 'info@gsoptimize.lk',
                phone: '+94 11 7792431',
                cover_image: '/industrial_premium.png',
                logo_url: '/solutions_logo.png',
                keywords: ['optimize']
            },
            {
                name: 'Seregen (Pvt) Ltd',
                category: 'FMCG & Consumer',
                description: 'Specialized manufacturing and formulation arm for personal care, wellness, and natural cosmetics under the Seri brand.',
                location: 'Steuart House, Colombo 03',
                website: 'www.serinaturals.com',
                email: 'info@seregen.lk',
                phone: '+94 11 255 4319',
                cover_image: '/consumer_cover.png',
                logo_url: '/consumer_logo.png',
                keywords: ['seregen']
            },
            {
                name: 'Divasa Pharma (Pvt) Ltd',
                category: 'Healthcare',
                description: 'Pharmaceutical marketing, distribution, and critical care therapeutics partner.',
                location: 'Colombo 08, Sri Lanka',
                website: 'www.gshealth.lk',
                email: 'info@divasapharma.lk',
                phone: '+94 11 420 2800',
                cover_image: '/health_cover.png',
                logo_url: '/health_logo.png',
                keywords: ['divasa']
            },
            {
                name: 'George Steuart Education (Pvt) Ltd',
                category: 'Services',
                description: 'Educational advisory, study abroad pathways, and professional executive development.',
                location: 'Steuart House, Colombo 03',
                website: 'www.georgesteuart.lk',
                email: 'info@gseducation.lk',
                phone: '+94 11 234 5678',
                cover_image: '/recruitment_premium.png',
                logo_url: '/recruitment_logo.png',
                keywords: ['education']
            },
            {
                name: 'George Steuart Laboratories (Pvt) Ltd',
                category: 'Healthcare',
                description: 'Medical laboratory and clinical diagnostic services supporting patient wellness nationwide.',
                location: 'Colombo 08, Sri Lanka',
                website: 'www.gshealth.lk',
                email: 'labs@gshealth.lk',
                phone: '+94 11 420 2800',
                cover_image: '/healthcare_premium.png',
                logo_url: '/health_logo.png',
                keywords: ['laboratories', 'labs']
            },
            {
                name: 'George Steuart Ethicals (Pvt) Ltd',
                category: 'Healthcare',
                description: 'Ethical pharmaceutical distribution partner delivering specialty healthcare medications.',
                location: 'Colombo 08, Sri Lanka',
                website: 'www.gshealth.lk',
                email: 'ethicals@gshealth.lk',
                phone: '+94 11 420 2800',
                cover_image: '/health_cover.png',
                logo_url: '/health_logo.png',
                keywords: ['ethicals']
            }
        ];

        for (const entity of entitiesToEnsure) {
            const [existing] = await db.execute("SELECT id, name FROM subsidiaries WHERE name LIKE ?", [`%${entity.keywords[0]}%`]);
            if (existing.length === 0) {
                const [res] = await db.execute(`
                    INSERT INTO subsidiaries 
                    (name, category, description, location, website, email, phone, status, cover_image, logo_url) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)
                `, [
                    entity.name,
                    entity.category,
                    entity.description,
                    entity.location,
                    entity.website,
                    entity.email,
                    entity.phone,
                    entity.cover_image,
                    entity.logo_url
                ]);
                console.log(`+ Created subsidiary: "${entity.name}" (ID: ${res.insertId})`);
            } else {
                console.log(`= Subsidiary already exists: "${existing[0].name}" (ID: ${existing[0].id})`);
            }
        }

        // Fetch all subsidiaries
        const [subs] = await db.execute("SELECT id, name FROM subsidiaries");
        console.log(`\nTotal subsidiaries in database: ${subs.length}`);

        const findSub = (...keywords) => {
            for (const kw of keywords) {
                const found = subs.find(s => s.name.toLowerCase().includes(kw.toLowerCase()));
                if (found) return found.id;
            }
            return null;
        };

        const subOptimizeId = findSub('optimize');
        const subSeregenId = findSub('seregen');
        const subDivasaId = findSub('divasa');
        const subEducationId = findSub('education');
        const subLabsId = findSub('laboratories', 'labs');
        const subEthicalsId = findSub('ethicals');
        const subHealthId = findSub('health');
        const subConsumerId = findSub('consumer');
        const subTravelsId = findSub('travel');
        const subHolidaysId = findSub('holiday');
        const subInsuranceId = findSub('insurance brokers', 'insurance');
        const subHoldingId = findSub('& co', 'holding', 'company ltd');
        const subHeladivId = findSub('heladiv', 'hva');
        const subTeasId = findSub('teas', 'tea');
        const subSolutionsId = findSub('solutions');
        const subInvestId = findSub('invest');
        const subAssetId = findSub('asset');
        const subAviationId = findSub('aviation');
        const subRecruitmentId = findSub('recruitment');
        const subCitrusId = findSub('citrus');

        function resolveUserSubId(user) {
            const email = (user.email || '').toLowerCase().trim();
            const company = (user.o365_company || '').toLowerCase().trim();
            const dept = (user.department || '').toLowerCase().trim();
            const allText = `${company} ${dept} ${email}`;

            // Specific entities first
            if (email.endsWith('@gsoptimize.lk') || allText.includes('optimize')) return subOptimizeId;
            if (email.endsWith('@seregen.lk') || allText.includes('seregen')) return subSeregenId || subConsumerId;
            if (email.endsWith('@divasapharma.lk') || allText.includes('divasa')) return subDivasaId || subHealthId;
            if (email.endsWith('@gseducation.lk') || allText.includes('education')) return subEducationId;
            if (email.endsWith('@gslabs.lk') || allText.includes('laboratories')) return subLabsId || subHealthId;
            if (allText.includes('ethicals')) return subEthicalsId || subHealthId;

            // General subsidiaries
            if (email.endsWith('@gshealth.lk') || email.endsWith('@gspharma.lk') || allText.includes('health') || allText.includes('pharma')) return subHealthId;
            if (email.endsWith('@gsconsumer.lk') || email.endsWith('@serinaturals.com') || allText.includes('consumer') || allText.includes('fmcg')) return subConsumerId;
            if (email.endsWith('@steuartholidays.com') || allText.includes('holiday')) return subHolidaysId || subTravelsId;
            if (email.endsWith('@gstravels.lk') || allText.includes('travel')) return subTravelsId;
            if (email.endsWith('@gsinsurance.lk') || allText.includes('insurance')) return subInsuranceId;
            if (email.endsWith('@heladiv.com') || email.endsWith('@heladiv.lk') || allText.includes('heladiv') || allText.includes('hva foods')) return subHeladivId;
            if (email.endsWith('@gsteas.lk') || (allText.includes('tea') && !allText.includes('heladiv'))) return subTeasId;
            if (email.endsWith('@gssolutions.lk') || allText.includes('solutions') || allText.includes('engineering')) return subSolutionsId;
            if (email.endsWith('@gsaviation.lk') || allText.includes('aviation')) return subAviationId;
            if (email.endsWith('@gsrecruitment.lk') || allText.includes('recruitment')) return subRecruitmentId;
            if (email.endsWith('@gsasset.lk') || email.endsWith('@gsam.lk') || allText.includes('asset management')) return subAssetId;
            if (allText.includes('investments') || allText.includes('invest')) return subInvestId;
            if (email.endsWith('@citrusleisure.com') || allText.includes('citrus')) return subCitrusId;
            if (email.endsWith('@georgesteuart.lk') || allText.includes('george steuart &') || allText.includes('george steuart group')) return subHoldingId;

            return subHoldingId; // Fallback to Holding company
        }

        console.log('\n--- Step 2: Remapping all users with specific Azure subsidiaries ---');
        const [users] = await db.execute("SELECT id, full_name, email, department, o365_company, subsidiary_id FROM users");
        let updatedCount = 0;

        for (const user of users) {
            const correctSubId = resolveUserSubId(user);
            if (correctSubId && correctSubId !== user.subsidiary_id) {
                await db.execute("UPDATE users SET subsidiary_id = ? WHERE id = ?", [correctSubId, user.id]);
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} user profiles.`);

        // Update employee counts in subsidiaries
        console.log('\n--- Step 3: Recalculating employee counts for each subsidiary ---');
        const [allSubs] = await db.execute("SELECT id, name FROM subsidiaries ORDER BY name ASC");
        for (const s of allSubs) {
            const [cntRes] = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE subsidiary_id = ? AND is_active = TRUE", [s.id]);
            await db.execute("UPDATE subsidiaries SET employees = ? WHERE id = ?", [cntRes[0].cnt, s.id]);
            console.log(`- ${s.name}: ${cntRes[0].cnt} employees`);
        }

        console.log('\nAzure subsidiaries sync completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error syncing Azure subsidiaries:', err);
        process.exit(1);
    }
}

syncAllAzureSubsidiaries();
