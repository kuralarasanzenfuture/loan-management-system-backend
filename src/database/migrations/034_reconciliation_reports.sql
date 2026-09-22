CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_uuid VARCHAR(64) NOT NULL UNIQUE,
    reconciliation_date DATE NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_ms INT NULL,
    status ENUM('clean', 'discrepancies_found', 'failed') NOT NULL DEFAULT 'clean',
    total_loans_checked INT NOT NULL DEFAULT 0,
    total_periods_checked INT NOT NULL DEFAULT 0,
    discrepancy_count INT NOT NULL DEFAULT 0,
    summary JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_recon_date (reconciliation_date),
    KEY idx_recon_status (status)
);
