CREATE TABLE
    IF NOT EXISTS loan_plan_penalties (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_plan_id BIGINT NOT NULL,
        grace_days INT DEFAULT 0,
        penalty_type ENUM ('fixed', 'percentage') NOT NULL,
        penalty_value DECIMAL(10, 2) NOT NULL,
        max_penalty DECIMAL(12, 2) DEFAULT NULL,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_plan_id) REFERENCES loan_plans (id) ON DELETE CASCADE,
        UNIQUE KEY unique_loan_plan_penalty (loan_plan_id)
    );