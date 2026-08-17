CREATE TABLE
    IF NOT EXISTS hand_loans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        hand_loan_no VARCHAR(50) NOT NULL UNIQUE,
        /* =====================================================
        DIRECTION
        ===================================================== */
        loan_direction ENUM ('given', 'borrowed') NOT NULL,
        /*
        given    = Company gives money to another person
        Company will RECEIVE money back
        
        borrowed = Company borrows money from another person
        Company will PAY money back
         */
        /* =====================================================
        PERSON
        ===================================================== */
        customer_id BIGINT NULL,
        person_name VARCHAR(200) NOT NULL,
        mobile VARCHAR(20),
        address VARCHAR(500),
        /* =====================================================
        AMOUNT
        ===================================================== */
        amount DECIMAL(15, 2) NOT NULL,
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        outstanding_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =====================================================
        DATES
        ===================================================== */
        given_date DATE NOT NULL,
        expected_return_date DATE,
        completed_date DATE NULL,
        /* =====================================================
        STATUS
        ===================================================== */
        status ENUM (
            'pending',
            'partial',
            'completed',
            'overdue',
            'cancelled'
        ) NOT NULL DEFAULT 'pending',
        /* =====================================================
        PAYMENT MODE
        ===================================================== */
        payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NOT NULL DEFAULT 'cash',
        /* =====================================================
        DESCRIPTION
        ===================================================== */
        purpose VARCHAR(255),
        remarks TEXT,
        /* =====================================================
        AUDIT
        ===================================================== */
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        /* =====================================================
        FOREIGN KEYS
        ===================================================== */
        CONSTRAINT fk_hand_loan_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_hand_loan_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_hand_loan_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        /* =====================================================
        INDEXES
        ===================================================== */
        INDEX idx_hand_loan_customer (customer_id),
        INDEX idx_hand_loan_direction (loan_direction),
        INDEX idx_hand_loan_status (status),
        INDEX idx_hand_loan_given_date (given_date),
        INDEX idx_hand_loan_return_date (expected_return_date),
        INDEX idx_hand_loan_person (person_name)
    );