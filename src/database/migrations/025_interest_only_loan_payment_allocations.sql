CREATE TABLE
    IF NOT EXISTS interest_only_loan_payment_allocations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        payment_id BIGINT NOT NULL,
        schedule_id BIGINT NULL,
        allocation_type ENUM ('interest', 'principal') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES interest_only_loan_payments (id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES interest_only_loan_schedules (id) ON DELETE SET NULL,
        INDEX idx_iol_allocation_payment (payment_id),
        INDEX idx_iol_allocation_schedule (schedule_id),
        INDEX idx_iol_allocation_type (allocation_type)
    );