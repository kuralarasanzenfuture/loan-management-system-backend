CREATE TABLE
    IF NOT EXISTS interest_loan_plans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        plan_code VARCHAR(50) NOT NULL,
        interest_type ENUM ('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        interest_value DECIMAL(12, 4) NOT NULL,
        interest_frequency ENUM ('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
        calculation_method ENUM ('simple') NOT NULL DEFAULT 'simple',
        principal_basis ENUM ('original_principal', 'outstanding_principal') NOT NULL DEFAULT 'outstanding_principal',
        payment_type ENUM ('anytime') NOT NULL DEFAULT 'anytime',
        status ENUM ('active', 'inactive') NOT NULL DEFAULT 'active',
        description TEXT,
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_interest_plan_code (plan_code),
        UNIQUE KEY uq_interest_plan_name (plan_name),
        KEY idx_interest_plan_status (status),
        KEY idx_interest_plan_frequency (interest_frequency),
        CONSTRAINT fk_interest_plan_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_interest_plan_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );

--     | id | plan       | code          | interest | frequency | principal basis       |
-- | -: | ---------- | ------------- | -------: | --------- | --------------------- |
-- |  1 | Monthly 2% | INT-MONTHLY-2 |       2% | monthly   | outstanding_principal |
-- |  2 | Monthly 3% | INT-MONTHLY-3 |       3% | monthly   | outstanding_principal |
-- |  3 | Weekly 1%  | INT-WEEKLY-1  |       1% | weekly    | outstanding_principal |