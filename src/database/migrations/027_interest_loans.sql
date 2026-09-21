CREATE TABLE
    IF NOT EXISTS interest_loans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_no VARCHAR(50) NOT NULL,
        customer_id BIGINT NOT NULL,
        interest_plan_id BIGINT NOT NULL,
        principal_amount DECIMAL(15, 2) NOT NULL,
        outstanding_principal DECIMAL(15, 2) NOT NULL,
        total_interest_accrued DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        outstanding_interest DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        interest_type ENUM ('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        interest_rate DECIMAL(12, 4) NOT NULL,
        interest_frequency ENUM ('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
        calculation_method ENUM ('simple') NOT NULL DEFAULT 'simple',
        principal_basis ENUM ('original_principal', 'outstanding_principal') NOT NULL DEFAULT 'outstanding_principal',
        start_date DATE NOT NULL,
        last_interest_date DATE NULL,
        next_interest_date DATE NULL,
        last_payment_date DATETIME NULL,
        status ENUM ('active', 'completed', 'closed', 'cancelled') NOT NULL DEFAULT 'active',
        remarks TEXT,
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_interest_loan_no (loan_no),
        KEY idx_interest_loan_customer (customer_id),
        KEY idx_interest_loan_plan (interest_plan_id),
        KEY idx_interest_loan_status (status),
        KEY idx_interest_loan_next_date (next_interest_date),
        KEY idx_interest_loan_start_date (start_date),
        CONSTRAINT fk_interest_loan_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_interest_loan_plan FOREIGN KEY (interest_plan_id) REFERENCES interest_loan_plans (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_interest_loan_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_interest_loan_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );

--     | ID | Loan No     | Customer  | Principal | Outstanding | Interest | Rate | Frequency | Start  | Next Interest | Status    |
-- | -: | ----------- | --------- | --------: | ----------: | -------: | ---: | --------- | ------ | ------------- | --------- |
-- |  1 | INTL-000001 | Suresh    | ₹1,00,000 |   ₹1,00,000 |       ₹0 |   2% | Monthly   | Sep 12 | Oct 12        | Active    |
-- |  2 | INTL-000002 | Kavitha   | ₹2,00,000 |   ₹2,00,000 |   ₹6,000 |   3% | Monthly   | Aug 31 | Sep 30        | Active    |
-- |  3 | INTL-000003 | Murugan   |   ₹50,000 |     ₹50,000 |   ₹1,000 |   1% | Weekly    | Sep 5  | Sep 26        | Active    |
-- |  4 | INTL-000004 | Meena     |   ₹75,000 |     ₹60,000 |       ₹0 |   2% | Monthly   | Aug 15 | Oct 15        | Active    |
-- |  5 | INTL-000005 | Priya     | ₹1,50,000 |   ₹1,50,000 |   ₹4,000 |   2% | Monthly   | Jul 1  | Oct 1         | Active    |
-- |  6 | INTL-000006 | Rajendran |   ₹25,000 |     ₹25,000 |       ₹0 |   1% | Daily     | Sep 20 | Sep 21        | Active    |
-- |  7 | INTL-000007 | Suresh    | ₹1,00,000 |     ₹80,000 |       ₹0 |   2% | Monthly   | Jul 31 | Sep 30        | Active    |
-- |  8 | INTL-000008 | Murugan   |   ₹50,000 |          ₹0 |       ₹0 |   2% | Monthly   | May 10 | NULL          | Completed |