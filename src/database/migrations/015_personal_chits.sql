CREATE TABLE
    IF NOT EXISTS personal_chits (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        chit_no VARCHAR(50) NOT NULL UNIQUE,
        /* =====================================================
        CHIT INFORMATION
        ===================================================== */
        chit_name VARCHAR(150) NOT NULL,
        chit_provider VARCHAR(200) NOT NULL,
        provider_mobile VARCHAR(20),
        provider_alternate_mobile VARCHAR(20),
        provider_address VARCHAR(500),
        /* =====================================================
        CHIT VALUE
        ===================================================== */
        chit_amount DECIMAL(15, 2) NOT NULL,
        /* =====================================================
        PAYMENT FREQUENCY
        ===================================================== */
        payment_schedule_type ENUM ('auto', 'manual') NOT NULL DEFAULT 'manual',
        payment_frequency ENUM ('weekly', 'monthly', 'quarterly', 'custom') NOT NULL DEFAULT 'monthly',
        payment_interval INT NOT NULL DEFAULT 1,
        /* =====================================================
        DATES
        ===================================================== */
        start_date DATE NOT NULL,
        expected_end_date DATE NULL,
        actual_end_date DATE NULL,
        /* =====================================================
        CHIT TAKEN
        ===================================================== */
        is_taken BOOLEAN NOT NULL DEFAULT FALSE,
        taken_date DATE NULL,
        chit_received_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        /* =====================================================
        SUMMARY
        ===================================================== */
        total_paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_pending_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        total_members INT NOT NULL DEFAULT 0,
        /* =====================================================
        STATUS
        ===================================================== */
        status ENUM ('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
        remarks TEXT,
        /* =====================================================
        AUDIT
        ===================================================== */
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_personal_chit_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_personal_chit_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_chit_provider (chit_provider),
        INDEX idx_provider_mobile (provider_mobile),
        INDEX idx_chit_amount (chit_amount),
        INDEX idx_start_date (start_date),
        INDEX idx_taken_date (taken_date),
        INDEX idx_status (status)
    );