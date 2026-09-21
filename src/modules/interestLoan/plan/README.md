# 📋 Interest Loan Plan Module (`026_interest_loan_plans.sql`)

Core plan configuration catalog for anytime interest loans in the Loan Management System.

---

## 📌 Architecture & Features

### 1. Flexible Product Configurations
- **Interest Type**: Supports `percentage` rates (e.g. `2.0%`) and `fixed` periodic charges.
- **Principal Basis**:
  - `outstanding_principal`: Periodic interest is calculated on the remaining reducing balance.
  - `original_principal`: Flat interest calculated on the initial principal.
- **Collection Frequencies**: `daily`, `weekly`, `monthly`, and `yearly`.
- **Payment Type**: `anytime` flexible customer principal/interest repayments.

### 2. Intelligent Plan Code Generator
- Automatically formats clean identifiers: `INT-{FREQUENCY}-{VALUE}` (e.g., `INT-MONTHLY-2`, `INT-WEEKLY-1`, `INT-DAILY-1`).
- Concurrency-safe suffix sequence handling (`INT-MONTHLY-2-1`) if duplicates exist.

### 3. Deletion Protection
- Guaranteed database integrity: Deleting a plan linked to any records in `interest_loans` is rejected with HTTP 400.

---

## 🗄 Database Schema Reference (`026_interest_loan_plans.sql`)

```sql
CREATE TABLE IF NOT EXISTS interest_loan_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50) NOT NULL,
    interest_type ENUM ('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    interest_value DECIMAL(12, 4) NOT NULL,
    interest_frequency ENUM ('daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    calculation_method ENUM ('simple') NOT NULL DEFAULT 'simple',
    principal_basis ENUM ('original_principal', 'outstanding_principal') NOT NULL DEFAULT 'outstanding_principal',
    payment_type ENUM ('anytime') NOT NULL DEFAULT 'anytime',
    status ENUM ('active', 'inactive') NOT NULL DEFAULT 'active',
    description TEXT,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_interest_plan_code (plan_code),
    UNIQUE KEY uq_interest_plan_name (plan_name),
    KEY idx_interest_plan_status (status),
    KEY idx_interest_plan_frequency (interest_frequency),
    CONSTRAINT fk_interest_plan_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_interest_plan_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

---

## 🔐 Security & Role Permissions

Protected with `verifyToken` and `checkPermission("MOD_INTEREST_LOAN_PLANS", action)`.

| Route | Method | Required Action | Description |
|---|---|---|---|
| `/api/interest-loan-plans` | `POST` | `CREATE` | Create new interest loan plan |
| `/api/interest-loan-plans` | `GET` | `VIEW` | List plans with pagination & filters |
| `/api/interest-loan-plans/active` | `GET` | `VIEW` | Query active plans for dropdown selector |
| `/api/interest-loan-plans/:id` | `GET` | `VIEW` | View plan details |
| `/api/interest-loan-plans/:id` | `PUT` | `EDIT` | Update plan configuration |
| `/api/interest-loan-plans/:id/status` | `PATCH` | `EDIT` | Toggle plan active / inactive |
| `/api/interest-loan-plans/:id` | `DELETE` | `DELETE` | Delete unused plan |

---

## 📂 Submodule File Structure

```
plan/
├── interestLoanPlan.controller.js  # Controller handlers & standardized responses
├── interestLoanPlan.model.js       # SQL queries, duplicate checks & pagination
├── interestLoanPlan.routes.js      # Express routes with permission checks
├── interestLoanPlan.service.js     # Auto code generator & transaction management
├── interestLoanPlan.validation.js  # Joi schema validations
├── Interest_Loan_Plan_API.postman_collection.json # Direct Postman collection
├── README.md                       # This module documentation
└── postman/
    ├── Interest_Loan_Plan_API.postman_collection.json
    └── README.md                   # Full Postman API testing guide
```
