CREATE TABLE
    IF NOT EXISTS interest_only_loans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_no VARCHAR(50) NOT NULL UNIQUE,
        customer_id BIGINT NOT NULL,
        interest_plan_id BIGINT NOT NULL,
        /* =========================
        LOAN DETAILS
        ========================= */
        principal_amount DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(12, 2) NOT NULL,
        interest_type ENUM ('fixed', 'percentage') NOT NULL,
        interest_frequency ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly') NOT NULL,
        tenure INT NOT NULL,
        tenure_type ENUM ('months', 'years') NOT NULL,
        /* =========================
        CALCULATED VALUES
        ========================= */
        total_interest DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_payable DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        outstanding_interest DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        outstanding_principal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =========================
        DATES
        ========================= */
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        /* =========================
        COMMISSION
        ========================= */
        commission_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        net_disbursed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =========================
        STATUS
        ========================= */
        status ENUM (
            'active',
            'completed',
            'closed',
            'default',
            'cancelled'
        ) NOT NULL DEFAULT 'active',
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        /* =========================
        FOREIGN KEYS
        ========================= */
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
        FOREIGN KEY (interest_plan_id) REFERENCES interest_only_loan_plans (id) ON DELETE RESTRICT,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
        INDEX idx_iol_customer (customer_id),
        INDEX idx_iol_plan (interest_plan_id),
        INDEX idx_iol_status (status),
        INDEX idx_iol_start_date (start_date),
        INDEX idx_iol_end_date (end_date)
    );