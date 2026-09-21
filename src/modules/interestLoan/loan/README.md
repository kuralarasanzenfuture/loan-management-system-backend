# 🏦 Interest Loans Module (`027_interest_loans.sql`)

Core customer anytime interest-based lending engine with automated lifecycle management, atomic sequential numbering, and automatic collection period scheduling.

---

## 📌 Architecture & Lifecycle

### 1. Fully Automated Lifecycle
- **Initialization**: When a loan is created via `POST /api/interest-loans`, the status is automatically initialized to `'active'`.
- **Completion**: When customer payments fully reduce both `outstanding_principal` to `0.00` and `outstanding_interest` to `0.00`, the system automatically marks `status = 'completed'` and sets `next_interest_date = NULL`.
- **Integrity Guarantee**: There are **no manual status update endpoints**. Status is strictly derived from actual financial transactions.

### 2. Concurrency-Safe Sequential Loan Numbering
- Generates sequential identifiers: `INTL-000001`, `INTL-000002`, `INTL-000003`, etc.
- Implemented using database row-level locking (`SELECT loan_no FROM interest_loans ORDER BY id DESC LIMIT 1 FOR UPDATE`) inside an isolated transaction.

### 3. Automatic Snapshotting & Schedule Generation
- Plan parameters (`interest_type`, `interest_rate`, `interest_frequency`, `calculation_method`, `principal_basis`) are snapshotted directly onto the loan to preserve terms even if the parent plan changes later.
- Computes `next_interest_date` based on the frequency (`daily`: +1 day, `weekly`: +1 week, `monthly`: +1 month, `yearly`: +1 year).
- In the same atomic database transaction, creates **Period 1** in `interest_loan_periods` with:
  - `opening_principal = principal_amount`
  - `interest_amount = (principal * rate) / 100` (or fixed value)
  - `scheduled_date = next_interest_date`
  - `status = 'pending'` (or `'due'` if today >= scheduled_date)

---

## 🗄 Database Schema Reference (`027_interest_loans.sql`)

```sql
CREATE TABLE IF NOT EXISTS interest_loans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_no VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    interest_plan_id BIGINT NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    outstanding_principal DECIMAL(15, 2) NOT NULL,
    total_interest_accrued DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_interest_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_principal_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_interest DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    interest_type ENUM ('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    interest_rate DECIMAL(12, 4) NOT NULL,
    interest_frequency ENUM ('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    calculation_method ENUM ('simple') NOT NULL DEFAULT 'simple',
    principal_basis ENUM ('original_principal', 'outstanding_principal') NOT NULL DEFAULT 'outstanding_principal',
    start_date DATE NOT NULL,
    last_interest_date DATE NULL,
    next_interest_date DATE NULL,
    last_payment_date DATETIME NULL,
    status ENUM ('active', 'completed', 'closed', 'cancelled') NOT NULL DEFAULT 'active',
    remarks TEXT,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_interest_loan_no (loan_no),
    KEY idx_interest_loan_customer (customer_id),
    KEY idx_interest_loan_plan (interest_plan_id),
    KEY idx_interest_loan_status (status),
    KEY idx_interest_loan_next_date (next_interest_date),
    KEY idx_interest_loan_start_date (start_date),
    CONSTRAINT fk_interest_loan_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_interest_loan_plan FOREIGN KEY (interest_plan_id) REFERENCES interest_loan_plans (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_interest_loan_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_interest_loan_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

---

## 🔐 Security & Role Permissions

Protected with `verifyToken` and `checkPermission("MOD_INTEREST_ONLY_LOANS", action)`.

| Route | Method | Required Action | Description |
|---|---|---|---|
| `/api/interest-loans` | `POST` | `CREATE` | Disburse new customer interest loan |
| `/api/interest-loans/summary` | `GET` | `VIEW` | View portfolio summary metrics |
| `/api/interest-loans` | `GET` | `VIEW` | List loans with pagination, search & filters |
| `/api/interest-loans/:id` | `GET` | `VIEW` | View loan details + linked period schedule |
| `/api/interest-loans/customer/:customer_id` | `GET` | `VIEW` | View all loans opened by a customer |
| `/api/interest-loans/:id` | `PUT` | `EDIT` | Update loan (guarded if payments recorded) |
| `/api/interest-loans/:id` | `DELETE` | `DELETE` | Delete loan (blocked if payments recorded) |

---

## 📂 Submodule File Structure

```
loan/
├── interestLoan.controller.js      # Request handling & JSON response dispatching
├── interestLoan.model.js           # SQL queries & atomic INTL-000001 sequence generator
├── interestLoan.routes.js          # Express route definitions with permissions
├── interestLoan.service.js         # Business validation, calculations & atomic transactions
├── interestLoan.validation.js      # Joi schemas (customer, plan, principal, start_date)
├── Interest_Loans_API.postman_collection.json # Direct copy of Postman collection
├── README.md                       # This module documentation
└── postman/
    ├── Interest_Loans_API.postman_collection.json
    └── README.md                   # Full Postman guide with sample request/response payloads
```
