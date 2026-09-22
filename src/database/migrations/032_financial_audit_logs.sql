CREATE TABLE IF NOT EXISTS financial_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    audit_id VARCHAR(64) NOT NULL UNIQUE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    loan_id BIGINT NOT NULL,
    period_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    actor_type ENUM('SYSTEM_CRON', 'USER', 'API_WORKER') NOT NULL DEFAULT 'SYSTEM_CRON',
    actor_id BIGINT NULL,
    job_id BIGINT NULL,
    request_id VARCHAR(64) NULL,
    before_state JSON NULL,
    after_state JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_fin_audit_loan (loan_id, entity_type),
    KEY idx_fin_audit_job (job_id),
    KEY idx_fin_audit_action_date (action, created_at)
);
