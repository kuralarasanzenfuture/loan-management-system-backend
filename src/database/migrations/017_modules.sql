CREATE TABLE
    IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        parent_id INT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_modules_parent FOREIGN KEY (parent_id) REFERENCES modules (id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_modules_parent (parent_id),
        INDEX idx_modules_active (is_active)
    );