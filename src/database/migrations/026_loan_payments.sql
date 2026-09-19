CREATE TABLE
    IF NOT EXISTS loan_payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_id BIGINT NOT NULL,
        installment_id BIGINT NOT NULL,
        payment_no INT NOT NULL,
        payment_date DATETIME NOT NULL,
        payment_amount DECIMAL(12, 2) NOT NULL,
        payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NOT NULL,
        transaction_reference VARCHAR(150) NULL,
        cheque_number VARCHAR(50) NULL,
        remarks TEXT,
        received_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE RESTRICT,
        FOREIGN KEY (installment_id) REFERENCES loan_installments (id) ON DELETE RESTRICT,
        FOREIGN KEY (received_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE KEY uq_loan_payment_no (loan_id, payment_no),
        INDEX idx_loan_payment_loan (loan_id),
        INDEX idx_loan_payment_installment (installment_id),
        INDEX idx_loan_payment_date (payment_date),
        INDEX idx_loan_payment_mode (payment_mode)
    );
