CREATE TABLE
    IF NOT EXISTS user_permissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        action_id INT NOT NULL,
        is_allowed BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_user_permissions_action FOREIGN KEY (action_id) REFERENCES module_actions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_user_action (user_id, action_id),
        INDEX idx_user_permissions_user (user_id),
        INDEX idx_user_permissions_action (action_id)
    );