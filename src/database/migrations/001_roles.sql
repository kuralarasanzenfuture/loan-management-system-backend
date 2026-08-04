-- CREATE TABLE IF NOT EXISTS roles (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(100) UNIQUE NOT NULL,
--   description TEXT,
--   status ENUM('active','inactive') DEFAULT 'active',
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
CREATE TABLE
  IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status ENUM ('active', 'inactive') DEFAULT 'active',
    is_system BOOLEAN DEFAULT FALSE, -- 🔴 protect ADMIN role
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );