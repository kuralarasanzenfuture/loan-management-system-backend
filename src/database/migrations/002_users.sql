CREATE TABLE
    IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        email VARCHAR(150),
        status ENUM ('active', 'inactive', 'blocked') DEFAULT 'active',
        last_login DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE
    );