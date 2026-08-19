CREATE TABLE
    IF NOT EXISTS personal_chit_payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        chit_id BIGINT NOT NULL,
        installment_no INT NOT NULL,
        /* =====================================================
        PAYMENT PERIOD
        ===================================================== */
        due_date DATE NOT NULL,
        payment_date DATE NULL,
        /* =====================================================
        ACTUAL AMOUNT
        ===================================================== */
        due_amount DECIMAL(15, 2) NOT NULL,
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        pending_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =====================================================
        PAYMENT
        ===================================================== */
        payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NULL,
        transaction_reference VARCHAR(150),
        /* =====================================================
        STATUS
        ===================================================== */
        status ENUM ('pending', 'partial', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
        remarks TEXT,
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_personal_chit_payment_chit FOREIGN KEY (chit_id) REFERENCES personal_chits (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_personal_chit_payment_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_personal_chit_payment_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        UNIQUE KEY uq_chit_installment (chit_id, installment_no),
        INDEX idx_chit (chit_id),
        INDEX idx_due_date (due_date),
        INDEX idx_payment_date (payment_date),
        INDEX idx_status (status)
    );