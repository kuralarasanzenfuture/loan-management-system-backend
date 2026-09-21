# 📅 Interest Loan Periods Module (`028_interest_loan_periods.sql`)

Tracks periodic interest billing cycles, collection schedules, due dates, and settlement progress for customer interest loans.

---

## 📌 Architecture & Lifecycle

### 1. What is an Interest Period?
Unlike fixed EMI loans with pre-computed amortization matrices, anytime interest loans generate billing periods based on the loan's frequency (`daily`, `weekly`, `monthly`, `yearly`). Each period tracks:
- **`period_no`**: 1, 2, 3...
- **`period_start_date`** & **`period_end_date`**: The date range for which interest is accrued.
- **`scheduled_date`**: The billing/collection target date.
- **`opening_principal`**: The principal balance subject to interest during this period.
- **`interest_amount`**: Calculated interest (`(opening_principal * rate) / 100`).
- **`paid_interest_amount`**: Cumulative interest paid towards this specific period.
- **`outstanding_interest_amount`**: Unpaid balance for this period (`interest_amount - paid_interest_amount`).

### 2. Period Status Lifecycle
```
[ Loan Created ] 
       │
       ▼
  ┌─────────┐   Scheduled date reaches
  │ pending │ ──────────────────────────► ┌─────┐
  └─────────┘     or passes CURRENT_DATE  │ due │
                                          └─────┘
                                             │
                       Partial payment       │  Full payment
                       received              │  received
                             ┌───────────────┴───────────────┐
                             ▼                               ▼
                       ┌─────────┐                     ┌─────────┐
                       │ partial │                     │  paid   │
                       └─────────┘                     └─────────┘
```

- **`pending`**: Upcoming collection period whose `scheduled_date` is in the future.
- **`due`**: Collection period whose `scheduled_date <= CURRENT_DATE()`. Advanced automatically by the system.
- **`partial`**: Part of the interest has been collected, but balance remains.
- **`paid`**: Interest for this period has been completely settled.

---

## 🗄 Database Schema Reference (`028_interest_loan_periods.sql`)

```sql
CREATE TABLE IF NOT EXISTS interest_loan_periods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    period_no INT NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_collection_date DATE NULL,
    opening_principal DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(12, 4) NOT NULL,
    interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    paid_interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_interest_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM ('pending', 'due', 'partial', 'paid') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_interest_period (loan_id, period_no),
    KEY idx_interest_period_loan (loan_id),
    KEY idx_interest_period_scheduled_date (scheduled_date),
    KEY idx_interest_period_status (status),
    CONSTRAINT fk_interest_period_loan FOREIGN KEY (loan_id) REFERENCES interest_loans (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

---

## 🔐 Security & Role Permissions

- **Permission Module Code**: `MOD_INTEREST_ONLY_LOANS`
- **Required Action**: `VIEW`

| Endpoint | Method | Action Code | Description |
|---|---|---|---|
| `/api/interest-loans/periods/loan/:loan_id` | `GET` | `VIEW` | Get all periods for a loan |
| `/api/interest-loan-periods/loan/:loan_id` | `GET` | `VIEW` | Direct alias for loan period schedule |
| `/api/interest-loans/periods/:id` | `GET` | `VIEW` | Get single period details by ID |
| `/api/interest-loan-periods/:id` | `GET` | `VIEW` | Direct alias for single period details |

---

## 🚀 API Endpoints Reference

### 1. Get Periods by Loan ID
Returns the chronological list of interest collection periods for a specific loan.

- **Route**: `GET /api/interest-loans/periods/loan/:loan_id` (or `/api/interest-loan-periods/loan/:loan_id`)
- **Auth Required**: Bearer Token (`VIEW` action)

#### Example Request
```http
GET /api/interest-loans/periods/loan/1
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "loan_id": 1,
      "period_no": 1,
      "period_start_date": "2026-09-12",
      "period_end_date": "2026-10-12",
      "scheduled_date": "2026-10-12",
      "actual_collection_date": null,
      "opening_principal": "100000.00",
      "interest_rate": "2.0000",
      "interest_amount": "2000.00",
      "paid_interest_amount": "0.00",
      "outstanding_interest_amount": "2000.00",
      "status": "pending",
      "created_at": "2026-09-21T12:50:00.000Z",
      "updated_at": "2026-09-21T12:50:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Period by ID
Returns details of an individual period record.

- **Route**: `GET /api/interest-loans/periods/:id` (or `/api/interest-loan-periods/:id`)
- **Auth Required**: Bearer Token (`VIEW` action)

#### Example Request
```http
GET /api/interest-loans/periods/1
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "loan_id": 1,
    "period_no": 1,
    "period_start_date": "2026-09-12",
    "period_end_date": "2026-10-12",
    "scheduled_date": "2026-10-12",
    "opening_principal": "100000.00",
    "interest_rate": "2.0000",
    "interest_amount": "2000.00",
    "paid_interest_amount": "0.00",
    "outstanding_interest_amount": "2000.00",
    "status": "pending"
  }
}
```
