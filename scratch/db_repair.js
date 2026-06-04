const db = require('../backend/config/db');

async function repair() {
    try {
        console.log('Restoring user-subsidiary mappings...');
        
        // 1. Janidu Perera (Super Admin) -> George Steuart & Co. (id: 1)
        await db.execute('UPDATE users SET subsidiary_id = 1 WHERE email = ?', ['admin@gs.com']);
        
        // 2. Sarah Silva (Sub Admin) -> George Steuart Health (id: 2)
        await db.execute('UPDATE users SET subsidiary_id = 2 WHERE email = ?', ['subadmin@gs.com']);
        
        // 3. Dilshan Rodrigo -> George Steuart Insurance (id: 3)
        await db.execute('UPDATE users SET subsidiary_id = 3 WHERE email = ?', ['employee@gs.com']);
        
        // 4. Nadumi Prathibha -> George Steuart & Co. (id: 1)
        await db.execute('UPDATE users SET subsidiary_id = 1 WHERE email = ?', ['nadumi@gsoptimize.lk']);
        
        // 5. Test (Super Admin) -> George Steuart & Co. (id: 1)
        await db.execute('UPDATE users SET subsidiary_id = 1 WHERE email = ?', ['test@gmail.com']);
        
        // 6. subadmin -> George Steuart & Co. (id: 1)
        await db.execute('UPDATE users SET subsidiary_id = 1 WHERE email = ?', ['subadmin@gmail.com']);

        console.log('All user-subsidiary mappings successfully restored!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repair();
