CREATE TABLE
    IF NOT EXISTS login_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT,
        username VARCHAR(100),
        login_time DATETIME,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status ENUM ('success', 'failed', 'blocked'),
        reason VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );