-- CREATE TABLE
--     IF NOT EXISTS company_details (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         /* =========================================================
--         BASIC COMPANY INFORMATION
--         ========================================================= */
--         company_name VARCHAR(200) NOT NULL,
--         legal_name VARCHAR(250),
--         trade_name VARCHAR(200),
--         company_code VARCHAR(50) UNIQUE,
--         business_type ENUM (
--             'proprietorship',
--             'partnership',
--             'llp',
--             'private_limited',
--             'public_limited',
--             'trust',
--             'society',
--             'other'
--         ) DEFAULT 'proprietorship',
--         business_description TEXT,
--         establishment_date DATE,
--         /* =========================================================
--         REGISTRATION DETAILS
--         ========================================================= */
--         registration_number VARCHAR(100),
--         registration_date DATE,
--         cin_number VARCHAR(50),
--         llpin_number VARCHAR(50),
--         gst_number VARCHAR(20),
--         gst_registration_date DATE,
--         pan_number VARCHAR(20),
--         tan_number VARCHAR(20),
--         udyam_number VARCHAR(50),
--         shop_license_number VARCHAR(100),
--         shop_license_expiry DATE,
--         trade_license_number VARCHAR(100),
--         trade_license_expiry DATE,
--         professional_tax_number VARCHAR(100),
--         /* =========================================================
--         FINANCIAL / LICENSE DETAILS
--         ========================================================= */
--         rbi_registration_number VARCHAR(100),
--         rbi_registration_date DATE,
--         license_number VARCHAR(100),
--         license_type VARCHAR(150),
--         license_issue_date DATE,
--         license_expiry_date DATE,
--         /* =========================================================
--         OWNER / AUTHORIZED PERSON
--         ========================================================= */
--         owner_name VARCHAR(200),
--         owner_mobile VARCHAR(20),
--         owner_email VARCHAR(150),
--         authorized_person_name VARCHAR(200),
--         authorized_person_designation VARCHAR(100),
--         authorized_person_mobile VARCHAR(20),
--         authorized_person_email VARCHAR(150),
--         /* =========================================================
--         CONTACT DETAILS
--         ========================================================= */
--         phone VARCHAR(30),
--         alternate_phone VARCHAR(30),
--         email VARCHAR(150),
--         alternate_email VARCHAR(150),
--         website VARCHAR(255),
--         /* =========================================================
--         ADDRESS
--         ========================================================= */
--         address_line_1 VARCHAR(255),
--         address_line_2 VARCHAR(255),
--         landmark VARCHAR(150),
--         city VARCHAR(100),
--         taluk VARCHAR(100),
--         district VARCHAR(100),
--         state VARCHAR(100),
--         state_code VARCHAR(10),
--         country VARCHAR(100) DEFAULT 'India',
--         pincode VARCHAR(10),
--         latitude DECIMAL(10, 8),
--         longitude DECIMAL(11, 8),
--         /* =========================================================
--         COMMUNICATION / BUSINESS HOURS
--         ========================================================= */
--         business_start_time TIME,
--         business_end_time TIME,
--         working_days VARCHAR(100),
--         weekly_off_day VARCHAR(20),
--         timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
--         /* =========================================================
--         BANK DETAILS
--         ========================================================= */
--         bank_name VARCHAR(150),
--         bank_branch VARCHAR(150),
--         account_holder_name VARCHAR(200),
--         account_number VARCHAR(100),
--         ifsc_code VARCHAR(20),
--         account_type ENUM ('savings', 'current', 'other'),
--         upi_id VARCHAR(100),
--         /* =========================================================
--         CASH / FINANCIAL SETTINGS
--         ========================================================= */
--         cash_opening_balance DECIMAL(15, 2) DEFAULT 0.00,
--         bank_opening_balance DECIMAL(15, 2) DEFAULT 0.00,
--         financial_year_start_month TINYINT DEFAULT 4,
--         currency_code VARCHAR(10) DEFAULT 'INR',
--         currency_symbol VARCHAR(10) DEFAULT '₹',
--         decimal_places TINYINT DEFAULT 2,
--         /* =========================================================
--         LOAN BUSINESS SETTINGS
--         ========================================================= */
--         default_loan_currency VARCHAR(10) DEFAULT 'INR',
--         default_grace_days INT DEFAULT 2,
--         default_penalty_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
--         default_penalty_value DECIMAL(12, 2) DEFAULT 0.00,
--         minimum_loan_amount DECIMAL(12, 2) DEFAULT 0.00,
--         maximum_loan_amount DECIMAL(12, 2) DEFAULT 0.00,
--         /* =========================================================
--         COMMISSION SETTINGS
--         ========================================================= */
--         default_commission_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
--         default_commission_value DECIMAL(12, 2) DEFAULT 0.00,
--         /* =========================================================
--         RECEIPT SETTINGS
--         ========================================================= */
--         receipt_prefix VARCHAR(30) DEFAULT 'REC',
--         loan_prefix VARCHAR(30) DEFAULT 'LN',
--         customer_prefix VARCHAR(30) DEFAULT 'CUS',
--         hand_loan_prefix VARCHAR(30) DEFAULT 'HL',
--         chit_prefix VARCHAR(30) DEFAULT 'CHIT',
--         expense_prefix VARCHAR(30) DEFAULT 'EXP',
--         payment_prefix VARCHAR(30) DEFAULT 'PAY',
--         receipt_footer TEXT,
--         receipt_header TEXT,
--         /* =========================================================
--         BRANDING
--         ========================================================= */
--         logo VARCHAR(500),
--         favicon VARCHAR(500),
--         stamp_image VARCHAR(500),
--         signature_image VARCHAR(500),
--         primary_color VARCHAR(20),
--         secondary_color VARCHAR(20),
--         /* =========================================================
--         SOCIAL / ONLINE DETAILS
--         ========================================================= */
--         facebook_url VARCHAR(255),
--         instagram_url VARCHAR(255),
--         youtube_url VARCHAR(255),
--         whatsapp_number VARCHAR(20),
--         /* =========================================================
--         DOCUMENT DETAILS
--         ========================================================= */
--         company_logo_document VARCHAR(500),
--         registration_document VARCHAR(500),
--         gst_certificate VARCHAR(500),
--         pan_document VARCHAR(500),
--         license_document VARCHAR(500),
--         /* =========================================================
--         NOTIFICATION SETTINGS
--         ========================================================= */
--         sms_enabled BOOLEAN DEFAULT TRUE,
--         email_enabled BOOLEAN DEFAULT TRUE,
--         whatsapp_enabled BOOLEAN DEFAULT FALSE,
--         /* =========================================================
--         SMS / EMAIL INFORMATION
--         ========================================================= */
--         sms_sender_id VARCHAR(50),
--         notification_email VARCHAR(150),
--         /* =========================================================
--         SECURITY / SYSTEM
--         ========================================================= */
--         status ENUM ('active', 'inactive') DEFAULT 'active',
--         is_verified BOOLEAN DEFAULT FALSE,
--         verified_at DATETIME NULL,
--         created_by BIGINT NULL,
--         updated_by BIGINT NULL,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         /* =========================================================
--         INDEXES
--         ========================================================= */
--         INDEX idx_company_name (company_name),
--         INDEX idx_company_code (company_code),
--         INDEX idx_gst (gst_number),
--         INDEX idx_pan (pan_number),
--         INDEX idx_status (status),
--         CONSTRAINT fk_company_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
--         CONSTRAINT fk_company_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
--     );
CREATE TABLE
    IF NOT EXISTS company_details (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        /* =====================================================
        BASIC INFORMATION
        ===================================================== */
        company_name VARCHAR(200) NOT NULL,
        legal_name VARCHAR(250),
        trade_name VARCHAR(200),
        business_type ENUM (
            'proprietorship',
            'partnership',
            'llp',
            'private_limited',
            'public_limited',
            'trust',
            'society',
            'other'
        ) DEFAULT 'proprietorship',
        business_description TEXT,
        establishment_date DATE,
        /* =====================================================
        REGISTRATION
        ===================================================== */
        gst_number VARCHAR(20) UNIQUE,
        pan_number VARCHAR(20) UNIQUE,
        /* =====================================================
        CONTACT
        ===================================================== */
        phone VARCHAR(30),
        alternate_phone VARCHAR(30),
        email VARCHAR(150),
        alternate_email VARCHAR(150),
        website VARCHAR(255),
        /* =====================================================
        ADDRESS
        ===================================================== */
        address_line_1 VARCHAR(255),
        address_line_2 VARCHAR(255),
        landmark VARCHAR(150),
        city VARCHAR(100),
        taluk VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        state_code VARCHAR(10),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(10),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        /* =====================================================
        BUSINESS HOURS
        ===================================================== */
        business_start_time TIME,
        business_end_time TIME,
        working_days VARCHAR(100),
        weekly_off_day VARCHAR(20),
        timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
        /* =====================================================
        BRANDING
        ===================================================== */
        logo VARCHAR(500),
        favicon VARCHAR(500),
        stamp_image VARCHAR(500),
        signature_image VARCHAR(500),
        /* =====================================================
        SOCIAL / ONLINE
        ===================================================== */
        facebook_url VARCHAR(255),
        instagram_url VARCHAR(255),
        youtube_url VARCHAR(255),
        whatsapp_number VARCHAR(20),
        /* =====================================================
        SYSTEM
        ===================================================== */
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_name (company_name),
        INDEX idx_gst (gst_number),
        INDEX idx_pan (pan_number),
        INDEX idx_status (status),
        CONSTRAINT fk_company_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_company_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    );