const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', ['admin@gs.com']);
        if (rows.length > 0) {
            console.log('Admin user already exists');
            process.exit();
        }

        // Insert Super Admin
        await db.execute(
            'INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['Janidu Perera', 'admin@gs.com', hashedPassword, 'super_admin', 1, 'IT', 'Group CTO']
        );

        // Insert Sub Admin
        await db.execute(
            'INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['Sarah Silva', 'subadmin@gs.com', hashedPassword, 'sub_admin', 2, 'HR', 'HR Manager']
        );

        // Insert Regular Employee
        await db.execute(
            'INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['Dilshan Rodrigo', 'employee@gs.com', hashedPassword, 'employee', 3, 'Operations', 'Project Lead']
        );

        console.log('Users seeded successfully (Super Admin, Sub Admin, Employee)');

        console.log('Super Admin seeded successfully');
        
        // Seed some mock posts
        await db.execute(
            'INSERT INTO posts (author_id, content, type, visibility) VALUES (?, ?, ?, ?)',
            [1, 'Welcome to the new API Family Intranet! We are excited to launch this platform.', 'announcement', 'global']
        );

        console.log('Mock data seeded successfully');

        // Seed some documents
        await db.execute(
            'INSERT INTO documents (title, category, file_url, subsidiary_id, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            ['Remote Work Policy 2026.pdf', 'Policies', '/uploads/remote_work.pdf', null, 1]
        );
        await db.execute(
            'INSERT INTO documents (title, category, file_url, subsidiary_id, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            ['Employee Handbook.pdf', 'HR', '/uploads/handbook.pdf', null, 1]
        );
        await db.execute(
            'INSERT INTO documents (title, category, file_url, subsidiary_id, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            ['Leave Request Form.docx', 'HR', '/uploads/leave_form.docx', null, 1]
        );

        // Seed some holidays
        const holidays = [
            ['Duruthu Full Moon Poya Day', '2026-01-03', 'Poya'],
            ['Tamil Thai Pongal Day', '2026-01-15', 'Mercantile'],
            ['Nawam Full Moon Poya Day', '2026-02-01', 'Poya'],
            ['Independence Day', '2026-02-04', 'Public'],
            ['Bak Full Moon Poya Day', '2026-04-01', 'Poya'],
            ['Sinhala & Tamil New Year Day', '2026-04-14', 'Public'],
            ['Vesak Full Moon Poya Day', '2026-05-01', 'Poya'],
            ['Christmas Day', '2026-12-25', 'Public']
        ];

        for (const [name, date, type] of holidays) {
            await db.execute('INSERT INTO holidays (name, holiday_date, type) VALUES (?, ?, ?)', [name, date, type]);
        }

        console.log('Documents and Holidays seeded successfully');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();
