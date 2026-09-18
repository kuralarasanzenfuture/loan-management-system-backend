-- CREATE TABLE
--     IF NOT EXISTS loan_plans (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         plan_name VARCHAR(100) NOT NULL,
--         plan_code VARCHAR(30) NOT NULL UNIQUE,
--         collection_frequency ENUM ('daily', 'weekly', 'monthly') NOT NULL,
--         tenure INT NOT NULL COMMENT '100 Days, 10 Weeks, 12 Months',
--         tenure_type ENUM ('days', 'weeks', 'months') NOT NULL,
--         loan_amount DECIMAL(12, 2) NOT NULL,
--         installment_amount DECIMAL(12, 2) NOT NULL,
--         total_repayment DECIMAL(12, 2) NOT NULL,
--         commission_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
--         commission_value DECIMAL(12, 2) DEFAULT 0,
--         description TEXT,
--         status ENUM ('active', 'inactive') DEFAULT 'active',
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
--     );
-- CREATE TABLE
--     IF NOT EXISTS loan_plans (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         plan_name VARCHAR(100) NOT NULL,
--         plan_code VARCHAR(30) NOT NULL UNIQUE,
--         collection_frequency ENUM ('daily', 'weekly', 'monthly') NOT NULL,
--         tenure INT NOT NULL,
--         tenure_type ENUM ('days', 'weeks', 'months') NOT NULL,
--         commission_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
--         commission_value DECIMAL(12, 2) DEFAULT 0,
--         description TEXT,
--         status ENUM ('active', 'inactive') DEFAULT 'active',
--         created_by BIGINT NOT NULL,
--         updated_by BIGINT DEFAULT NULL,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         UNIQUE KEY unique_plan_name (plan_name),
--         UNIQUE KEY unique_plan_code (plan_code)
--     );
/*=============================================================*/
CREATE TABLE
    IF NOT EXISTS loan_plans (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        plan_code VARCHAR(30) NOT NULL UNIQUE,
        collection_frequency ENUM ('daily', 'weekly', 'monthly') NOT NULL,
        skip_sunday BOOLEAN NOT NULL DEFAULT FALSE,
        tenure INT NOT NULL,
        tenure_type ENUM ('days', 'weeks', 'months') NOT NULL,
        commission_type ENUM ('fixed', 'percentage') NOT NULL DEFAULT 'fixed',
        commission_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        description TEXT,
        status ENUM ('active', 'inactive') NOT NULL DEFAULT 'active',
        created_by BIGINT NOT NULL,
        updated_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_plan_name (plan_name),
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
    );