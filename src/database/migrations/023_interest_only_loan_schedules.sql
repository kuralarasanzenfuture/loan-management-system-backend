CREATE TABLE
    IF NOT EXISTS interest_only_loan_schedules (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_id BIGINT NOT NULL,
        schedule_no INT NOT NULL,
        due_date DATE NOT NULL,
        /* =========================
        DUE AMOUNTS
        ========================= */
        interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        principal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_due DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =========================
        PAYMENT
        ========================= */
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        balance_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        paid_date DATE NULL,
        /* =========================
        TYPE
        ========================= */
        payment_type ENUM ('interest', 'principal', 'interest_and_principal') NOT NULL DEFAULT 'interest',
        /* =========================
        STATUS
        ========================= */
        status ENUM ('pending', 'partial', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES interest_only_loans (id) ON DELETE CASCADE,
        UNIQUE KEY uq_iol_schedule (loan_id, schedule_no),
        INDEX idx_iol_schedule_loan (loan_id),
        INDEX idx_iol_schedule_due_date (due_date),
        INDEX idx_iol_schedule_status (status)
    );