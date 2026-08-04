CREATE TABLE
    IF NOT EXISTS user_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        refresh_token_hash VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_name VARCHAR(150),
        login_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        logout_at DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );