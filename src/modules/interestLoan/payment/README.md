# Interest Loan - Payments & Payment Allocations Submodule

Comprehensive financial payment processing, automated interest-first FIFO allocations, principal balance reduction, payment receipts, and atomic reversal engine for Anytime Interest Loans.

Directly implements schemas:
- **`029_interest_loan_payments.sql`** (`interest_loan_payments`)
- **`030_interest_loan_payment_allocations.sql`** (`interest_loan_payment_allocations`)

---

## 1. Module Overview & Architecture

### File Structure
```
src/modules/interestLoan/payment/
├── interestLoanPayment.controller.js  # HTTP request/response handlers
├── interestLoanPayment.model.js       # Database access, summary aggregations & queries
├── interestLoanPayment.service.js     # Transactional business logic & FIFO allocation engine
├── interestLoanPayment.validation.js  # Joi validation schemas (create, preview, query)
├── interestLoanPayment.routes.js      # Express route definitions & permission guards
├── Interest_Loan_Payments_API.postman_collection.json # Direct Postman collection
├── README.md                          # Technical reference documentation (this file)
└── postman/
    ├── Interest_Loan_Payments_API.postman_collection.json
    └── README.md                      # Postman testing guide
```

---

## 2. Business Rules & Financial Allocation Mechanics

### Allocation Priority (Interest-First / FIFO)
1. **Interest Precedence**:
   - Anytime loan payments automatically prioritize clearing overdue and scheduled interest before applying payments to the principal balance.
   - Unpaid periods (`pending`, `due`, `partial`) are satisfied in strict chronological order (`period_no ASC`).
2. **Principal Reduction**:
   - Any residual payment amount remaining after settling outstanding interest is allocated directly toward `outstanding_principal`.
   - If the loan plan calculates interest on `outstanding_principal`, upcoming pending periods automatically recalculate their future interest liability on the reduced balance.
3. **Automated Lifecycle Transitions**:
   - Status starts at `'active'`.
   - When both `outstanding_principal == 0.00` and `outstanding_interest == 0.00`, the loan automatically transitions to `'completed'`, and `next_interest_date` is set to `NULL`.
4. **Targeted Period Collections**:
   - Clients can specify an optional `interest_period_id` to direct funds toward a specific billing cycle.
5. **Alternative Allocation Strategies**:
   - `auto` (default): FIFO interest first, balance to principal.
   - `manual`: Explicit `interest_amount` and `principal_amount` provided and validated.
   - `interest_only`: Dedicated interest payment (capped at `outstanding_interest`).
   - `principal_only`: Dedicated principal reduction (capped at `outstanding_principal`).

---

## 3. Database Schema Mapping

### `interest_loan_payments` (Migration `029`)
| Column | Type | Description |
|---|---|---|
| `id` | `BIGINT AUTO_INCREMENT` | Primary Key |
| `loan_id` | `BIGINT NOT NULL` | References `interest_loans(id)` |
| `payment_no` | `INT NOT NULL` | Sequential counter per loan (`1, 2, 3...`) |
| `payment_date` | `DATETIME NOT NULL` | Date and time of payment |
| `payment_amount` | `DECIMAL(15, 2) NOT NULL` | Total payment amount received |
| `interest_amount` | `DECIMAL(15, 2) NOT NULL` | Portion allocated to interest |
| `principal_amount`| `DECIMAL(15, 2) NOT NULL` | Portion allocated to principal |
| `outstanding_interest_before` | `DECIMAL(15, 2)` | Snapshot before payment |
| `outstanding_principal_before`| `DECIMAL(15, 2)` | Snapshot before payment |
| `outstanding_interest_after`  | `DECIMAL(15, 2)` | Balance after payment |
| `outstanding_principal_after` | `DECIMAL(15, 2)` | Balance after payment |
| `payment_mode` | `ENUM('cash','bank','upi','cheque','other')` | Method of settlement |
| `transaction_reference` | `VARCHAR(150)` | UTR / Transaction / UPI reference |
| `cheque_number` | `VARCHAR(50)` | Cheque identifier |
| `remarks` | `TEXT` | Notes and comments |
| `received_by` | `BIGINT` | References `users(id)` |
| `created_at` | `TIMESTAMP` | Record creation timestamp |

### `interest_loan_payment_allocations` (Migration `030`)
| Column | Type | Description |
|---|---|---|
| `id` | `BIGINT AUTO_INCREMENT` | Primary Key |
| `payment_id` | `BIGINT NOT NULL` | Foreign key referencing `interest_loan_payments(id)` |
| `interest_period_id` | `BIGINT NULL` | References `interest_loan_periods(id)` (NULL for principal) |
| `allocation_type` | `ENUM('interest', 'principal')` | Nature of allocation |
| `amount` | `DECIMAL(15, 2) NOT NULL` | Amount allocated |
| `created_at` | `TIMESTAMP` | Timestamp |

---

## 4. API Endpoints Reference

All endpoints are prefixed with `/api/interest-loans/payments` (or direct alias `/api/interest-loan-payments`).

| Method | Endpoint | Action | Description |
|---|---|---|---|
| `POST` | `/api/interest-loans/payments/preview` | `VIEW` | Preview allocation without committing to DB |
| `POST` | `/api/interest-loans/payments` | `CREATE` | Record new loan payment |
| `GET` | `/api/interest-loans/payments/summary` | `VIEW` | Aggregate payment metrics by mode & date |
| `GET` | `/api/interest-loans/payments` | `VIEW` | List payments with filters & pagination |
| `GET` | `/api/interest-loans/payments/:id` | `VIEW` | Get payment receipt with line-item allocations |
| `GET` | `/api/interest-loans/payments/loan/:loan_id` | `VIEW` | Get all payments for a loan |
| `GET` | `/api/interest-loans/payments/customer/:customer_id` | `VIEW` | Get all payments for a customer |
| `DELETE`| `/api/interest-loans/payments/:id` | `DELETE` | Atomic payment reversal / rollback |

---

## 5. Sample Payloads & Responses

### A. Preview Allocation (`POST /preview`)
**Request Body:**
```json
{
  "loan_id": 2,
  "payment_amount": 6000.00,
  "allocation_strategy": "auto"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "loan_id": 2,
    "loan_no": "INTL-000002",
    "customer_name": "Kavitha",
    "payment_amount": 6000,
    "strategy": "auto",
    "outstanding_interest_before": 6000,
    "outstanding_principal_before": 200000,
    "allocated_interest": 6000,
    "allocated_principal": 0,
    "outstanding_interest_after": 0,
    "outstanding_principal_after": 200000,
    "projected_loan_status": "active",
    "period_allocations": [
      {
        "period_no": 1,
        "scheduled_date": "2026-09-30",
        "period_interest_due": 6000,
        "allocated_amount": 6000,
        "remaining_due": 0,
        "projected_period_status": "paid"
      }
    ]
  }
}
```

### B. Record Payment (`POST /`)
**Request Body:**
```json
{
  "loan_id": 2,
  "payment_amount": 6000.00,
  "payment_mode": "upi",
  "transaction_reference": "UPI/20260921/887766",
  "remarks": "September month interest settled"
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Payment #1 recorded successfully",
  "data": {
    "id": 1,
    "loan_id": 2,
    "payment_no": 1,
    "payment_date": "2026-09-21 15:35:00",
    "payment_amount": 6000,
    "interest_amount": 6000,
    "principal_amount": 0,
    "outstanding_interest_before": 6000,
    "outstanding_principal_before": 200000,
    "outstanding_interest_after": 0,
    "outstanding_principal_after": 200000,
    "payment_mode": "upi",
    "transaction_reference": "UPI/20260921/887766",
    "loan_no": "INTL-000002",
    "customer_name": "Kavitha",
    "allocations": [
      {
        "allocation_id": 1,
        "allocation_type": "interest",
        "amount": 6000,
        "period_no": 1,
        "period_start_date": "2026-08-31",
        "period_end_date": "2026-09-30",
        "period_status": "paid"
      }
    ]
  }
}
```

### C. Payment Reversal (`DELETE /:id`)
**Response:**
```json
{
  "success": true,
  "message": "Payment #1 reversed successfully",
  "data": {
    "reversed_payment_id": 1,
    "loan_id": 2,
    "restored_outstanding_interest": 6000,
    "restored_outstanding_principal": 200000,
    "loan_status": "active"
  }
}
```
