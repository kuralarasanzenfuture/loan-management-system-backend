CREATE TABLE
    IF NOT EXISTS interest_only_loan_payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_id BIGINT NOT NULL,
        payment_no INT NOT NULL,
        payment_date DATETIME NOT NULL,
        payment_amount DECIMAL(15, 2) NOT NULL,
        payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NOT NULL,
        transaction_reference VARCHAR(150) NULL,
        cheque_number VARCHAR(50) NULL,
        remarks TEXT,
        received_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES interest_only_loans (id) ON DELETE RESTRICT,
        FOREIGN KEY (received_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE KEY uq_iol_payment_no (loan_id, payment_no),
        INDEX idx_iol_payment_loan (loan_id),
        INDEX idx_iol_payment_date (payment_date),
        INDEX idx_iol_payment_mode (payment_mode)
    );