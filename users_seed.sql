-- User Seed File for GS-Intranet Database
-- Target Database: gs_intranet
-- Default password for all seeded users: admin123
-- (Bcrypt Hash: $2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG)

USE gs_intranet;

-- Temporarily disable foreign key checks to avoid deletion or insertion ordering issues
SET FOREIGN_KEY_CHECKS = 0;

-- Optional: Clear existing users if you want a fresh start. 
-- Uncomment the line below if you want to wipe the users table before seeding:
-- TRUNCATE TABLE users;

-- Seed Users
-- We use INSERT INTO ... ON DUPLICATE KEY UPDATE to prevent errors if the email already exists,
-- updating their roles and core details to match the seed specification.

INSERT INTO users (
    id,
    full_name, 
    email, 
    password, 
    role, 
    subsidiary_id, 
    department, 
    job_title, 
    phone, 
    profile_pic, 
    bio, 
    joining_date, 
    is_active, 
    nic_number, 
    employee_no, 
    needs_password_change, 
    date_of_birth
) VALUES
(
    1,
    'Janidu Perera', 
    'admin@gs.com', 
    '$2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG', 
    'super_admin', 
    1, 
    'IT', 
    'Group CTO', 
    '+94 77 123 4567', 
    NULL, 
    'Overseeing group-wide digital transformation and IT infrastructure.', 
    '2024-01-01', 
    1, 
    '199012345678', 
    'EMP-001', 
    0, 
    '1990-05-15'
),
(
    2,
    'Sarah Silva', 
    'subadmin@gs.com', 
    '$2b$10$oB5aVYJbbX3OW1t81E/HceR4XXKJc5S7QObVYFEZ8xwY1r7WArZ2S', 
    'sub_admin', 
    2, 
    'HR', 
    'HR Manager', 
    '+94 77 234 5678', 
    NULL, 
    'Managing human resources operations and talent acquisition.', 
    '2024-02-15', 
    1, 
    '199298765432', 
    'EMP-002', 
    0, 
    '1992-08-22'
),
(
    3,
    'Dilshan Rodrigo', 
    'employee@gs.com', 
    '$2b$10$sYtxTrv.8WoAgo65Gl/BY.srBpiUqiDa9qFaBSnG0gdYl/mkL.cnm', 
    'employee', 
    3, 
    'Operations', 
    'Project Lead', 
    '+94 77 345 6789', 
    NULL, 
    'Leading operational projects and continuous improvement initiatives.', 
    '2024-03-01', 
    1, 
    '199456789123', 
    'EMP-003', 
    0, 
    '1994-11-05'
),
(
    15,
    'IT Admin User', 
    'itadmin@gs.com', 
    '$2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG', 
    'it_admin', 
    1, 
    'IT', 
    'IT Systems Manager', 
    '+94 77 456 7890', 
    NULL, 
    'Managing IT systems infrastructure and service delivery.', 
    '2024-01-10', 
    1, 
    '198812345678', 
    'EMP-IT_ADMIN', 
    0, 
    '1988-03-12'
),
(
    16,
    'HR Admin User', 
    'hradmin@gs.com', 
    '$2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG', 
    'hr_admin', 
    1, 
    'HR', 
    'HR Operations Manager', 
    '+94 77 567 8901', 
    NULL, 
    'Managing group-wide HR policies, benefits, and employee relations.', 
    '2024-01-12', 
    1, 
    '198987654321', 
    'EMP-HR_ADMIN', 
    0, 
    '1989-06-25'
),
(
    17,
    'IT Support Specialist', 
    'itstaff@gs.com', 
    '$2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG', 
    'it_staff', 
    1, 
    'IT', 
    'IT Support Engineer', 
    '+94 77 678 9012', 
    NULL, 
    'Providing technical support and troubleshooting services.', 
    '2024-04-01', 
    1, 
    '199512345678', 
    'EMP-IT_STAFF', 
    0, 
    '1995-10-18'
),
(
    18,
    'HR Support Specialist', 
    'hrstaff@gs.com', 
    '$2b$10$U6bZ.kfTZnIoCICC28W7MOqyHo7IomCzO4jWYVrRn1DC.p5WepzUG', 
    'hr_staff', 
    1, 
    'HR', 
    'HR Assistant', 
    '+94 77 789 0123', 
    NULL, 
    'Assisting with HR administration and employee onboarding.', 
    '2024-04-05', 
    1, 
    '199798765432', 
    'EMP-HR_STAFF', 
    0, 
    '1997-12-04'
)
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    password = VALUES(password),
    role = VALUES(role),
    subsidiary_id = VALUES(subsidiary_id),
    department = VALUES(department),
    job_title = VALUES(job_title),
    phone = VALUES(phone),
    joining_date = VALUES(joining_date),
    is_active = VALUES(is_active),
    nic_number = VALUES(nic_number),
    employee_no = VALUES(employee_no),
    needs_password_change = VALUES(needs_password_change),
    date_of_birth = VALUES(date_of_birth);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
