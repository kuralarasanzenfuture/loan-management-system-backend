CREATE TABLE
    IF NOT EXISTS interest_only_loan_plans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        plan_code VARCHAR(50) NOT NULL,
        interest_type ENUM ('fixed', 'percentage') NOT NULL DEFAULT 'percentage',
        interest_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        interest_frequency ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly') NOT NULL DEFAULT 'monthly',
        tenure INT NOT NULL,
        tenure_type ENUM ('months', 'years') NOT NULL DEFAULT 'months',
        principal_repayment ENUM ('end_of_term') NOT NULL DEFAULT 'end_of_term',
        penalty_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        commission_type ENUM ('none', 'fixed', 'percentage') NOT NULL DEFAULT 'none',
        commission_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        description TEXT,
        status ENUM ('active', 'inactive') NOT NULL DEFAULT 'active',
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_interest_plan_code (plan_code),
        UNIQUE KEY uq_interest_plan_name (plan_name),
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
        INDEX idx_interest_plan_status (status)
    );

--     Loan Amount = ₹50,000
-- Monthly Interest = ₹50,000 × 2%
--                  = ₹1,000
-- Month 1   → ₹1,000 interest
-- Month 2   → ₹1,000 interest
-- ...
-- Month 12  → ₹1,000 interest
-- Total Interest = ₹12,000
-- End of Month 12:
-- Principal = ₹50,000
-- Total paid = ₹62,000
