CREATE TABLE
    IF NOT EXISTS interest_loan_periods (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_id BIGINT NOT NULL,
        period_no INT NOT NULL,
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        scheduled_date DATE NOT NULL,
        actual_collection_date DATE NULL,
        opening_principal DECIMAL(15, 2) NOT NULL,
        interest_rate DECIMAL(12, 4) NOT NULL,
        interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        paid_interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        outstanding_interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        status ENUM ('pending', 'due', 'partial', 'paid') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_interest_period (loan_id, period_no),
        UNIQUE KEY uq_interest_period_date (loan_id, scheduled_date),
        KEY idx_interest_period_loan (loan_id),
        KEY idx_interest_period_scheduled_date (scheduled_date),
        KEY idx_interest_period_status (status),
        CONSTRAINT fk_interest_period_loan FOREIGN KEY (loan_id) REFERENCES interest_loans (id) ON DELETE RESTRICT ON UPDATE CASCADE
    );