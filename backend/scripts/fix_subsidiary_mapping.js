const db = require('../config/db');

async function fixSubsidiaries() {
    try {
        console.log('--- Step 1: Ensuring "George Steuart Optimize (Pvt) Ltd" exists in subsidiaries ---');
        
        const [optSub] = await db.execute("SELECT id, name FROM subsidiaries WHERE name LIKE '%optimize%'");
        let optimizeSubId;

        if (optSub.length === 0) {
            console.log('Creating "George Steuart Optimize (Pvt) Ltd" in subsidiaries table...');
            const [insertRes] = await db.execute(`
                INSERT INTO subsidiaries 
                (name, category, description, location, website, email, phone, status, cover_image, logo_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'George Steuart Optimize (Pvt) Ltd',
                'IT & Digital',
                'The technology, software engineering, and digital transformation arm of the George Steuart Group.',
                'Steuart House, Colombo 03',
                'www.gsoptimize.lk',
                'info@gsoptimize.lk',
                '+94 11 7792431',
                'Active',
                '/industrial_premium.png',
                '/solutions_logo.png'
            ]);
            optimizeSubId = insertRes.insertId;
            console.log(`Created George Steuart Optimize with ID: ${optimizeSubId}`);
        } else {
            optimizeSubId = optSub[0].id;
            console.log(`George Steuart Optimize exists with ID: ${optimizeSubId} (${optSub[0].name})`);
        }

        // Fetch all subsidiaries
        const [subs] = await db.execute("SELECT id, name FROM subsidiaries");
        console.log(`Loaded ${subs.length} total subsidiaries.`);

        // Helper to find subsidiary by keyword
        const findSub = (...keywords) => {
            for (const kw of keywords) {
                const found = subs.find(s => s.name.toLowerCase().includes(kw.toLowerCase()));
                if (found) return found.id;
            }
            return null;
        };

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

        console.log('Subsidiary IDs mapped:');
        console.log({
            Optimize: optimizeSubId,
            Health: subHealthId,
            Consumer: subConsumerId,
            Travels: subTravelsId,
            Holidays: subHolidaysId,
            Insurance: subInsuranceId,
            Holding: subHoldingId,
            Heladiv: subHeladivId,
            Teas: subTeasId,
            Solutions: subSolutionsId,
            Invest: subInvestId,
            Asset: subAssetId,
            Aviation: subAviationId,
            Recruitment: subRecruitmentId,
            Citrus: subCitrusId
        });

        // Resolve user subsidiary
        function resolveUserSubId(user) {
            const email = (user.email || '').toLowerCase().trim();
            const company = (user.o365_company || '').toLowerCase().trim();
            const dept = (user.department || '').toLowerCase().trim();
            const allText = `${company} ${dept} ${email}`;

            // 1. Optimize
            if (email.endsWith('@gsoptimize.lk') || allText.includes('optimize')) {
                return optimizeSubId;
            }
            // 2. Health & Pharma
            if (email.endsWith('@gshealth.lk') || email.endsWith('@divasapharma.lk') || email.endsWith('@gslabs.lk') || email.endsWith('@gspharma.lk') ||
                allText.includes('health') || allText.includes('pharma') || allText.includes('divasa') || allText.includes('laboratories') || allText.includes('ethicals')) {
                return subHealthId;
            }
            // 3. Consumer & FMCG
            if (email.endsWith('@gsconsumer.lk') || email.endsWith('@seregen.lk') || email.endsWith('@serinaturals.com') ||
                allText.includes('consumer') || allText.includes('seregen') || allText.includes('fmcg')) {
                return subConsumerId;
            }
            // 4. Steuart Holidays
            if (email.endsWith('@steuartholidays.com') || allText.includes('holiday')) {
                return subHolidaysId || subTravelsId;
            }
            // 5. Travels
            if (email.endsWith('@gstravels.lk') || allText.includes('travel')) {
                return subTravelsId;
            }
            // 6. Insurance
            if (email.endsWith('@gsinsurance.lk') || allText.includes('insurance')) {
                return subInsuranceId;
            }
            // 7. Heladiv / HVA Foods
            if (email.endsWith('@heladiv.com') || email.endsWith('@heladiv.lk') || allText.includes('heladiv') || allText.includes('hva foods')) {
                return subHeladivId;
            }
            // 8. Teas
            if (email.endsWith('@gsteas.lk') || (allText.includes('tea') && !allText.includes('heladiv'))) {
                return subTeasId;
            }
            // 9. Solutions & Engineering
            if (email.endsWith('@gssolutions.lk') || allText.includes('solutions') || allText.includes('engineering')) {
                return subSolutionsId;
            }
            // 10. Aviation
            if (email.endsWith('@gsaviation.lk') || allText.includes('aviation')) {
                return subAviationId;
            }
            // 11. Recruitment
            if (email.endsWith('@gsrecruitment.lk') || allText.includes('recruitment')) {
                return subRecruitmentId;
            }
            // 12. Asset Management
            if (email.endsWith('@gsasset.lk') || email.endsWith('@gsam.lk') || allText.includes('asset management')) {
                return subAssetId;
            }
            // 13. Investments
            if (allText.includes('investments') || allText.includes('invest')) {
                return subInvestId;
            }
            // 14. Citrus
            if (email.endsWith('@citrusleisure.com') || allText.includes('citrus')) {
                return subCitrusId;
            }
            // 15. Holding & Parent Group
            if (email.endsWith('@georgesteuart.lk') || allText.includes('george steuart &') || allText.includes('george steuart group')) {
                return subHoldingId;
            }

            return null;
        }

        // Clean up department text
        function resolveCleanDept(user, subId) {
            let dept = (user.department || '').trim();
            const lower = dept.toLowerCase();
            
            // If department is just the company name or generic, clean it up
            if (lower.includes('(pvt) ltd') || lower.includes('ltd') || lower.includes('plc') || lower === 'office 365' || !dept) {
                if (subId === optimizeSubId) return 'Technology & IT Services';
                if (subId === subHealthId) return 'Healthcare Operations';
                if (subId === subConsumerId) return 'Consumer & Retail';
                if (subId === subTravelsId) return 'Travel Services';
                if (subId === subHolidaysId) return 'Inbound Holidays';
                if (subId === subInsuranceId) return 'Insurance Brokerage';
                if (subId === subHoldingId) return 'Corporate Office';
                if (subId === subHeladivId) return 'Operations & Production';
                if (subId === subTeasId) return 'Tea Operations';
                if (subId === subSolutionsId) return 'Industrial & Climate Solutions';
                if (subId === subAviationId) return 'Aviation Services';
                if (subId === subRecruitmentId) return 'Recruitment & Manpower';
                if (subId === subAssetId) return 'Asset Management';
                if (subId === subInvestId) return 'Money Market & Forex';
                if (subId === subCitrusId) return 'Hospitality & Leisure';
                return 'General';
            }
            return dept;
        }

        console.log('\n--- Step 2: Fixing users table mappings ---');
        const [users] = await db.execute("SELECT id, full_name, email, department, o365_company, subsidiary_id FROM users");
        console.log(`Examining ${users.length} users in database...`);

        let updatedCount = 0;
        let optimizeCount = 0;

        for (const user of users) {
            const correctSubId = resolveUserSubId(user);
            const cleanDept = resolveCleanDept(user, correctSubId);

            // Update if subsidiary_id is different or department was company name
            if (correctSubId !== user.subsidiary_id || cleanDept !== user.department) {
                await db.execute(
                    "UPDATE users SET subsidiary_id = ?, department = ? WHERE id = ?",
                    [correctSubId, cleanDept, user.id]
                );
                updatedCount++;
                if (correctSubId === optimizeSubId) {
                    optimizeCount++;
                }
            }
        }

        console.log(`\nSuccessfully updated ${updatedCount} users!`);
        console.log(`Users assigned to George Steuart Optimize: ${optimizeCount}`);

        // Update employee counts in subsidiaries
        console.log('\n--- Step 3: Updating subsidiary employee counts ---');
        const [allSubs] = await db.execute("SELECT id, name FROM subsidiaries");
        for (const s of allSubs) {
            const [cntRes] = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE subsidiary_id = ? AND is_active = TRUE", [s.id]);
            await db.execute("UPDATE subsidiaries SET employees = ? WHERE id = ?", [cntRes[0].cnt, s.id]);
            console.log(`- ${s.name}: ${cntRes[0].cnt} employees`);
        }

        // Verify Nadumi Jayawardhana
        const [nadumi] = await db.execute(`
            SELECT u.id, u.full_name, u.email, u.department, u.subsidiary_id, s.name as subsidiary_name 
            FROM users u 
            LEFT JOIN subsidiaries s ON u.subsidiary_id = s.id 
            WHERE u.email LIKE '%nadumi%'
        `);
        console.log('\n--- Verification for Nadumi Jayawardhana ---');
        console.log(JSON.stringify(nadumi, null, 2));

        console.log('\nAll done successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

fixSubsidiaries();
