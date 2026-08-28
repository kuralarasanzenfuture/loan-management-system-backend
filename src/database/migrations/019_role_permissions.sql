CREATE TABLE
    IF NOT EXISTS role_permissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        action_id INT NOT NULL,
        is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_role_permissions_action FOREIGN KEY (action_id) REFERENCES module_actions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_role_action (role_id, action_id),
        INDEX idx_role_permissions_role (role_id),
        INDEX idx_role_permissions_action (action_id)
    );