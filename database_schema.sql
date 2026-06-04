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
    role ENUM('super_admin', 'sub_admin', 'employee') NOT NULL,
    subsidiary_id INT,
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone VARCHAR(20),
    profile_pic VARCHAR(255),
    bio TEXT,
    nic_number VARCHAR(20),
    employee_no VARCHAR(20),
    needs_password_change BOOLEAN DEFAULT TRUE,
    joining_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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


-- Seed Subsidiaries
INSERT INTO subsidiaries (name, description, location, website, email, phone, employees) VALUES 
('George Steuart & Co.', 'The oldest mercantile establishment in Sri Lanka, George Steuart & Company is a diversified conglomerate with a heritage spanning over 185 years.', 'Colombo 03, Sri Lanka', 'www.georgesteuarts.com', 'info@gs.com', '+94 11 232 6881', 450),
('George Steuart Optimize-IT & Digital Services', 'A leading provider of cutting-edge technology solutions, specializing in digital transformation, software development, and IT consulting.', 'Colombo 07, Sri Lanka', 'www.gsoptimize.com', 'it.support@gs.com', '+94 11 456 7890', 120),
('George Steuart Health', 'One of the largest pharmaceutical importers and distributors in Sri Lanka, representing world-renowned healthcare brands.', 'Colombo 08, Sri Lanka', 'www.gshealth.com', 'health@gs.com', '+94 11 233 4455', 300),
('George Steuart Teas', 'Exporters of the finest Ceylon Tea to over 50 countries, continuing a legacy of quality and craftsmanship.', 'Colombo 13, Sri Lanka', 'www.gsteas.com', 'tea@gs.com', '+94 11 244 5566', 250),
('George Steuart Travels', 'A premier travel management company providing comprehensive corporate and leisure travel solutions.', 'Colombo 01, Sri Lanka', 'www.gstravels.com', 'travel@gs.com', '+94 11 211 2233', 85);

