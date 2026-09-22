ALTER TABLE interest_loans ADD INDEX idx_interest_loan_accrual_keyset (status, next_interest_date, id);
