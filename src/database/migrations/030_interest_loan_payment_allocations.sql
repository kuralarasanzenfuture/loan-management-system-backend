CREATE TABLE
    IF NOT EXISTS interest_loan_payment_allocations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        payment_id BIGINT NOT NULL,
        interest_period_id BIGINT NULL,
        allocation_type ENUM ('interest', 'principal') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_allocation_payment (payment_id),
        KEY idx_allocation_period (interest_period_id),
        CONSTRAINT fk_allocation_payment FOREIGN KEY (payment_id) REFERENCES interest_loan_payments (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_allocation_period FOREIGN KEY (interest_period_id) REFERENCES interest_loan_periods (id) ON DELETE SET NULL ON UPDATE CASCADE
    );