CREATE TABLE
    IF NOT EXISTS customer_documents (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        customer_id BIGINT NOT NULL,
        document_type ENUM (
            'aadhaar',
            'pan',
            'driving_license',
            'voter_id',
            'passport',
            'ration_card',
            'bank_passbook',
            'salary_slip',
            'electricity_bill',
            'gas_bill',
            'photo',
            'other'
        ) NOT NULL,
        document_number VARCHAR(100),
        file_name VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_customer_documents_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY unique_customer_document (customer_id, document_type),
        INDEX idx_customer (customer_id),
        INDEX idx_document_type (document_type),
        INDEX idx_verified (verified)
    );