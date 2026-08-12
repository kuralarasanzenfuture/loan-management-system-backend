CREATE TABLE
    IF NOT EXISTS bank_transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_bank_id BIGINT NOT NULL,
        transaction_no VARCHAR(50) NOT NULL UNIQUE,
        transaction_date DATETIME NOT NULL,
        transaction_type ENUM ('credit', 'debit') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        balance_before DECIMAL(15, 2) NOT NULL,
        balance_after DECIMAL(15, 2) NOT NULL,
        /* =====================================================
        SOURCE
        ===================================================== */
        reference_type ENUM (
            'loan_collection',
            'loan_disbursement',
            'hand_loan_repayment',
            'hand_loan_disbursement',
            'expense',
            'income',
            'cash_deposit',
            'cash_withdrawal',
            'bank_transfer',
            'chit_payment',
            'chit_receipt',
            'salary',
            'other'
        ) NOT NULL,
        reference_id BIGINT NULL,
        /* =====================================================
        PAYMENT INFORMATION
        ===================================================== */
        payment_method ENUM (
            'bank_transfer',
            'upi',
            'neft',
            'rtgs',
            'imps',
            'cheque',
            'cash_deposit',
            'other'
        ) NULL,
        transaction_reference VARCHAR(150),
        cheque_number VARCHAR(50),
        /* =====================================================
        DESCRIPTION
        ===================================================== */
        description TEXT,
        remarks TEXT,
        status ENUM ('active', 'reversed', 'cancelled') DEFAULT 'active',
        reversal_id BIGINT NULL,
        /* =====================================================
        AUDIT
        ===================================================== */
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bank_transaction_bank FOREIGN KEY (company_bank_id) REFERENCES company_banks (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_bank_transaction_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        UPDATE bank_transactions SET status = 'active' WHERE status IS NULL;
        INDEX idx_bank (company_bank_id),
        INDEX idx_transaction_date (transaction_date),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_reference (reference_type, reference_id),
        INDEX idx_payment_reference (transaction_reference),
        INDEX idx_bank_transaction_status (status)
    );