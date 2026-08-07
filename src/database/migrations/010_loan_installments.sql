CREATE TABLE
    IF NOT EXISTS loan_installments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        loan_id BIGINT NOT NULL,
        installment_no INT NOT NULL,
        due_date DATE NOT NULL,
        principal_amount DECIMAL(12, 2) NOT NULL,
        penalty_amount DECIMAL(12, 2) DEFAULT 0,
        total_due DECIMAL(12, 2) NOT NULL,
        paid_amount DECIMAL(12, 2) DEFAULT 0,
        balance_amount DECIMAL(12, 2) NOT NULL,
        paid_date DATE NULL,
        status ENUM ('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE CASCADE,
        UNIQUE KEY uq_loan_installment (loan_id, installment_no),
        INDEX idx_installment_loan (loan_id),
        INDEX idx_installment_due_date (due_date),
        INDEX idx_installment_status (status)
    );