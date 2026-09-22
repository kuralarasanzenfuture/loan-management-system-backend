CREATE TABLE IF NOT EXISTS reconciliation_discrepancies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    loan_id BIGINT NOT NULL,
    discrepancy_type VARCHAR(50) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    expected_value VARCHAR(100) NOT NULL,
    actual_value VARCHAR(100) NOT NULL,
    details JSON NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at DATETIME NULL,
    resolved_by BIGINT NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_recon_disc_report (report_id),
    KEY idx_recon_disc_loan (loan_id),
    KEY idx_recon_disc_severity (severity),
    CONSTRAINT fk_recon_disc_report FOREIGN KEY (report_id) REFERENCES reconciliation_reports (id) ON DELETE CASCADE ON UPDATE CASCADE
);
