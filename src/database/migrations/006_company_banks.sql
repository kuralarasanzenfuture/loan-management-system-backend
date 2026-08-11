CREATE TABLE
    IF NOT EXISTS company_banks (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_id BIGINT NULL,
        /* =====================================================
        BANK INFORMATION
        ===================================================== */
        bank_name VARCHAR(150) NOT NULL,
        bank_code VARCHAR(50),
        branch_name VARCHAR(150),
        branch_code VARCHAR(50),
        account_holder_name VARCHAR(200) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        account_type ENUM (
            'savings',
            'current',
            'cash_credit',
            'overdraft',
            'other'
        ) NOT NULL DEFAULT 'current',
        ifsc_code VARCHAR(20),
        micr_code VARCHAR(20),
        swift_code VARCHAR(20),
        /* =====================================================
        ACCOUNT BALANCE
        ===================================================== */
        opening_balance DECIMAL(15, 2) DEFAULT 0.00,
        current_balance DECIMAL(15, 2) DEFAULT 0.00,
        /* =====================================================
        DIGITAL PAYMENT
        ===================================================== */
        upi_id VARCHAR(100),
        upi_qr_code VARCHAR(500),
        /* =====================================================
        PURPOSE
        ===================================================== */
        account_purpose ENUM (
            'business',
            'collection',
            'loan_disbursement',
            'expenses',
            'salary',
            'savings',
            'other'
        ) DEFAULT 'business',
        /* =====================================================
        DEFAULT ACCOUNT
        ===================================================== */
        is_primary BOOLEAN DEFAULT FALSE,
        is_collection_account BOOLEAN DEFAULT FALSE,
        is_disbursement_account BOOLEAN DEFAULT FALSE,
        /* =====================================================
        STATUS
        ===================================================== */
        status ENUM ('active', 'inactive', 'closed') DEFAULT 'active',
        opened_date DATE,
        closed_date DATE NULL,
        remarks TEXT,
        /* =====================================================
        AUDIT
        ===================================================== */
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_company_banks_company FOREIGN KEY (company_id) REFERENCES company_details (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_company_banks_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_company_banks_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_company (company_id),
        INDEX idx_bank_name (bank_name),
        INDEX idx_account_number (account_number),
        INDEX idx_ifsc (ifsc_code),
        INDEX idx_status (status)
    );