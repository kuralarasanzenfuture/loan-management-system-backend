CREATE TABLE
    IF NOT EXISTS hand_loan_transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        transaction_no VARCHAR(50) NOT NULL UNIQUE,
        hand_loan_id BIGINT NOT NULL,
        /* =====================================================
        TRANSACTION TYPE
        ===================================================== */
        transaction_type ENUM ('disbursement', 'collection', 'repayment') NOT NULL,
        /*
        disbursement:
        Company gives money
        
        collection:
        Company receives money from person
        
        repayment:
        Company pays borrowed money back
         */
        /* =====================================================
        AMOUNT
        ===================================================== */
        amount DECIMAL(15, 2) NOT NULL,
        transaction_date DATETIME NOT NULL,
        /* =====================================================
        PAYMENT
        ===================================================== */
        payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NOT NULL DEFAULT 'cash',
        company_bank_id BIGINT NULL,
        transaction_reference VARCHAR(150),
        cheque_number VARCHAR(50),
        /* =====================================================
        DESCRIPTION
        ===================================================== */
        description TEXT,
        remarks TEXT,
        /* =====================================================
        STATUS
        ===================================================== */
        status ENUM ('active', 'reversed', 'cancelled') NOT NULL DEFAULT 'active',
        reversal_id BIGINT NULL,
        /* =====================================================
        AUDIT
        ===================================================== */
        received_by BIGINT NULL,
        created_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        /* =====================================================
        FOREIGN KEYS
        ===================================================== */
        CONSTRAINT fk_hand_transaction_loan FOREIGN KEY (hand_loan_id) REFERENCES hand_loans (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_hand_transaction_bank FOREIGN KEY (company_bank_id) REFERENCES company_banks (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_hand_transaction_received_by FOREIGN KEY (received_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_hand_transaction_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_hand_transaction_reversal FOREIGN KEY (reversal_id) REFERENCES hand_loan_transactions (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_hand_transaction_loan (hand_loan_id),
        INDEX idx_hand_transaction_date (transaction_date),
        INDEX idx_hand_transaction_type (transaction_type),
        INDEX idx_hand_transaction_status (status)
    );