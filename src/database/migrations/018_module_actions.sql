CREATE TABLE
    IF NOT EXISTS module_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        action_code VARCHAR(50) NOT NULL,
        action_name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_module_actions_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_module_action (module_id, action_code),
        INDEX idx_module_actions_module (module_id),
        INDEX idx_module_actions_active (is_active)
    );