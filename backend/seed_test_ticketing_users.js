const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const usersToSeed = [
            { name: 'IT Admin User', email: 'itadmin@gs.com', role: 'it_admin', dept: 'IT', job: 'IT Systems Manager' },
            { name: 'HR Admin User', email: 'hradmin@gs.com', role: 'hr_admin', dept: 'HR', job: 'HR Operations Manager' },
            { name: 'IT Support Specialist', email: 'itstaff@gs.com', role: 'it_staff', dept: 'IT', job: 'IT Support Engineer' },
            { name: 'HR Support Specialist', email: 'hrstaff@gs.com', role: 'hr_staff', dept: 'HR', job: 'HR Assistant' }
        ];

        for (const u of usersToSeed) {
            // Check if user already exists
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [u.email]);
            if (rows.length > 0) {
                console.log(`User ${u.email} already exists, updating role...`);
                await db.execute('UPDATE users SET role = ?, department = ?, job_title = ? WHERE email = ?', [u.role, u.dept, u.job, u.email]);
            } else {
                console.log(`Creating user ${u.email}...`);
                await db.execute(
                    'INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title, employee_no, nic_number, is_active, needs_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)',
                    [u.name, u.email, hashedPassword, u.role, 1, u.dept, u.job, `EMP-${u.role.toUpperCase()}`, `NIC-${u.role.toUpperCase()}`]
                );
            }
        }

        console.log('Test ticketing users seeded/updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding test users:', err);
        process.exit(1);
    }
}

seed();
