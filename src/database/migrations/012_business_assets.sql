-- CREATE TABLE
--     IF NOT EXISTS business_assets (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         asset_no VARCHAR(50) NOT NULL UNIQUE,
--         category_id BIGINT NOT NULL,
--         /* ===============================
--         ASSET DETAILS
--         =============================== */
--         asset_name VARCHAR(150) NOT NULL,
--         brand VARCHAR(100),
--         model VARCHAR(100),
--         serial_number VARCHAR(150),
--         description TEXT,
--         /* ===============================
--         PRICE
--         =============================== */
--         purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
--         purchase_date DATE,
--         vendor_name VARCHAR(150),
--         invoice_number VARCHAR(100),
--         /* ===============================
--         CURRENT VALUE
--         =============================== */
--         current_value DECIMAL(15, 2) DEFAULT 0.00,
--         /* ===============================
--         IMAGE
--         =============================== */
--         image VARCHAR(500),
--         /* ===============================
--         LOCATION
--         =============================== */
--         location VARCHAR(150),
--         /* ===============================
--         STATUS
--         =============================== */
--         condition_status ENUM ('new', 'good', 'fair', 'damaged') DEFAULT 'new',
--         status ENUM ('active', 'inactive', 'sold', 'disposed') DEFAULT 'active',
--         /* ===============================
--         NOTES
--         =============================== */
--         remarks TEXT,
--         /* ===============================
--         AUDIT
--         =============================== */
--         created_by BIGINT NULL,
--         updated_by BIGINT NULL,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         CONSTRAINT fk_asset_category FOREIGN KEY (category_id) REFERENCES asset_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
--         CONSTRAINT fk_asset_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
--         CONSTRAINT fk_asset_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
--         INDEX idx_category (category_id),
--         INDEX idx_asset_name (asset_name),
--         INDEX idx_serial_number (serial_number),
--         INDEX idx_purchase_date (purchase_date),
--         INDEX idx_status (status)
--     );
CREATE TABLE
    IF NOT EXISTS business_assets (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        asset_no VARCHAR(50) NOT NULL UNIQUE,
        category_id BIGINT NOT NULL,
        /* ===============================
        ASSET DETAILS
        =============================== */
        asset_name VARCHAR(150) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(150),
        description TEXT,
        /* ===============================
        PURCHASE DETAILS
        =============================== */
        purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        purchase_date DATE NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        vendor_name VARCHAR(150),
        invoice_number VARCHAR(100),
        /* ===============================
        IMAGE
        =============================== */
        image VARCHAR(500),
        /* ===============================
        LOCATION
        =============================== */
        location VARCHAR(150),
        /* ===============================
        STATUS
        =============================== */
        condition_status ENUM ('new', 'good', 'fair', 'damaged') DEFAULT 'new',
        status ENUM ('active', 'inactive', 'sold', 'disposed') DEFAULT 'active',
        remarks TEXT,
        /* ===============================
        AUDIT
        =============================== */
        created_by BIGINT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_asset_category FOREIGN KEY (category_id) REFERENCES asset_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_asset_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_asset_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_category (category_id),
        INDEX idx_asset_name (asset_name),
        INDEX idx_serial_number (serial_number),
        INDEX idx_purchase_date (purchase_date),
        INDEX idx_status (status)
    );