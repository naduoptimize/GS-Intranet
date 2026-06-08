CREATE DATABASE IF NOT EXISTS gs_intranet;
USE gs_intranet;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subsidiaries;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS holidays;
SET FOREIGN_KEY_CHECKS = 1;

-- Subsidiaries Table
CREATE TABLE subsidiaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mission TEXT,
    vision TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    employees INT DEFAULT 0,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subsidiary Directors Table
CREATE TABLE subsidiary_directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subsidiary_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    image_url VARCHAR(255),
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
);

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    subsidiary_id INT DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    job_title VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    profile_pic VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    joining_date DATE DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nic_number VARCHAR(20) DEFAULT NULL,
    employee_no VARCHAR(20) DEFAULT NULL,
    needs_password_change TINYINT(1) DEFAULT 1,
    reset_otp VARCHAR(6) DEFAULT NULL,
    reset_otp_expiry DATETIME DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL
);

-- Posts Table
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    type ENUM('announcement', 'achievement', 'event', 'orientation', 'general') DEFAULT 'general',
    visibility ENUM('global', 'subsidiary') DEFAULT 'global',
    subsidiary_id INT, -- If visibility is subsidiary
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
);

-- Comments Table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reactions Table
CREATE TABLE reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(20) DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reaction (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents Table
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category ENUM('Code of Conduct', 'Policies', 'Request Letters', 'HR', 'Insurance', 'Travel') NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    subsidiary_id INT, -- NULL if global
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events Table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    subsidiary_id INT, -- NULL if global
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE
);

-- Holidays Table
CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    type ENUM('Poya', 'Group', 'Public', 'Mercantile') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tickets Table
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(50) UNIQUE,
    user_id INT NOT NULL,
    assigned_to_id INT DEFAULT NULL,
    subject VARCHAR(255) NOT NULL,
    department ENUM('it', 'hr', 'general') NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    description TEXT NOT NULL,
    status ENUM('open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolution_date TIMESTAMP NULL DEFAULT NULL,
    sla_deadline TIMESTAMP NULL DEFAULT NULL,
    employee_deadline DATETIME DEFAULT NULL,
    extension_reason TEXT DEFAULT NULL,
    extended_by_name VARCHAR(255) DEFAULT NULL,
    extended_by_role VARCHAR(50) DEFAULT NULL,
    extended_on DATETIME DEFAULT NULL,
    assigned_to VARCHAR(150) DEFAULT 'Unassigned',
    assigned_email VARCHAR(150) DEFAULT '-',
    resolution_notes TEXT DEFAULT NULL,
    rating INT DEFAULT NULL,
    feedback TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ticket Comments Table
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket Attachments Table
CREATE TABLE ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket Audit Logs Table
CREATE TABLE ticket_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket Internal Notes Table
CREATE TABLE ticket_internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket Deadline History Table
CREATE TABLE ticket_deadline_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    old_deadline DATETIME DEFAULT NULL,
    new_deadline DATETIME DEFAULT NULL,
    reason TEXT NOT NULL,
    updated_by_id INT NOT NULL,
    updated_by_name VARCHAR(255) NOT NULL,
    updated_by_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);


-- Seed Subsidiaries
INSERT INTO subsidiaries (name, description, location, website, email, phone, employees) VALUES 
('George Steuart & Co.', 'The oldest mercantile establishment in Sri Lanka, George Steuart & Company is a diversified conglomerate with a heritage spanning over 185 years.', 'Colombo 03, Sri Lanka', 'www.georgesteuarts.com', 'info@gs.com', '+94 11 232 6881', 450),
('George Steuart Optimize-IT & Digital Services', 'A leading provider of cutting-edge technology solutions, specializing in digital transformation, software development, and IT consulting.', 'Colombo 07, Sri Lanka', 'www.gsoptimize.com', 'it.support@gs.com', '+94 11 456 7890', 120),
('George Steuart Health', 'One of the largest pharmaceutical importers and distributors in Sri Lanka, representing world-renowned healthcare brands.', 'Colombo 08, Sri Lanka', 'www.gshealth.com', 'health@gs.com', '+94 11 233 4455', 300),
('George Steuart Teas', 'Exporters of the finest Ceylon Tea to over 50 countries, continuing a legacy of quality and craftsmanship.', 'Colombo 13, Sri Lanka', 'www.gsteas.com', 'tea@gs.com', '+94 11 244 5566', 250),
('George Steuart Travels', 'A premier travel management company providing comprehensive corporate and leisure travel solutions.', 'Colombo 01, Sri Lanka', 'www.gstravels.com', 'travel@gs.com', '+94 11 211 2233', 85);


-- Seed Users (Password is 'admin123' for all)
INSERT INTO users (full_name, email, password, role, subsidiary_id, department, job_title, employee_no, needs_password_change) VALUES
('Lakshan', 'lakshan@gsoptimize.lk', '$2b$10$Fqqgloc3KYs.LMbmo87Gnu3iKCwMpFC4MVazfcsroimjOg9pi54ou', 'super_admin', 2, 'IT', 'Group CTO', 'EMP-001', 0),
('Nadumi', 'nadumi@gsoptimize.lk', '$2b$10$Fqqgloc3KYs.LMbmo87Gnu3iKCwMpFC4MVazfcsroimjOg9pi54ou', 'super_admin', 2, 'IT', 'Group CEO', 'EMP-002', 0);

