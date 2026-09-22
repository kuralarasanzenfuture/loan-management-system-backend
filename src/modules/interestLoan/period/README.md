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
| `/api/interest-loans/periods/collections/today` | `GET` | `VIEW` | Today's interest collections list & summary |
| `/api/interest-loans/periods/collections/overdue` | `GET` | `VIEW` | Overdue interest collections list & aging summary |
| `/api/interest-loans/periods/collections` | `GET` | `VIEW` | Unified collections overview with KPI summary counters |
| `/api/interest-loans/periods/loan/:loan_id` | `GET` | `VIEW` | Get all periods for a loan |
| `/api/interest-loan-periods/loan/:loan_id` | `GET` | `VIEW` | Direct alias for loan period schedule |
| `/api/interest-loans/periods/:id` | `GET` | `VIEW` | Get single period details by ID |
| `/api/interest-loan-periods/:id` | `GET` | `VIEW` | Direct alias for single period details |
| `/api/interest-loans/periods/cron/run` | `POST` | `EDIT` | On-demand trigger for daily accrual cron |

---

## 💡 Architecture Decision: Single API vs. Separate APIs

When designing collection APIs for banking and loan management systems, the industry standard best practice is **providing both**:

1. **Dedicated Specialized APIs** (`/collections/today` and `/collections/overdue`):
   - **Performance & Efficiency**: Dedicated views filter specifically without pulling irrelevant historical rows.
   - **Frontend Separation**: Collection agents often work from specialized tabs (e.g., *Today's Calls / Field Visits* vs. *Delinquency / Recovery Follow-ups*).
   - **Specific Metrics**: Overdue returns delinquency metrics like `days_overdue` and `max_days_overdue`, whereas Today returns operational metrics like `total_due_amount` and `total_collected_amount`.
2. **Unified Collections Overview API** (`/collections`):
   - **Executive Dashboard**: Provides high-level KPI cards (`today`, `overdue`, `upcoming_7_days`) in a single network request.
   - **Filter Flexibility**: Supports query parameter `?type=today|overdue|all` allowing responsive UI data-tables to switch filters seamlessly without switching API endpoints.

---

## 🚀 API Endpoints Reference

### 1. Today's Collections
Retrieves all collection periods scheduled for today (or a queried target date) along with loan, customer, and scheme details.

- **Route**: `GET /api/interest-loans/periods/collections/today` (or `/api/interest-loan-periods/today`)
- **Auth Required**: Bearer Token (`VIEW` action)
- **Query Parameters**:
  - `date` (optional, YYYY-MM-DD): Filter by specific collection date (defaults to today).
  - `status` (optional): Filter by period status (`due`, `partial`, `paid`, or `all`). Defaults to unpaid periods (`!= 'paid'`).
  - `search` (optional): Search by loan number, customer ID, customer name, or mobile.

#### Example Request
```http
GET /api/interest-loans/periods/collections/today?status=due
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "summary": {
      "date": "2026-09-21",
      "total_records": 12,
      "total_due_amount": 35000.00,
      "total_collected_amount": 10000.00,
      "total_outstanding_amount": 25000.00
    },
    "data": [
      {
        "id": 15,
        "loan_id": 4,
        "period_no": 1,
        "period_start_date": "2026-08-21",
        "period_end_date": "2026-09-21",
        "scheduled_date": "2026-09-21",
        "actual_collection_date": null,
        "opening_principal": 100000.00,
        "interest_rate": 2.0000,
        "interest_amount": 2000.00,
        "paid_interest_amount": 0.00,
        "outstanding_interest_amount": 2000.00,
        "status": "due",
        "loan_no": "INTL-000004",
        "loan_principal": 100000.00,
        "outstanding_principal": 100000.00,
        "interest_frequency": "monthly",
        "loan_status": "active",
        "customer_id": 2,
        "customer_no": "CUST-000002",
        "first_name": "Rajesh",
        "last_name": "Kumar",
        "customer_name": "Rajesh Kumar",
        "customer_mobile": "9876543210",
        "plan_name": "Gold Monthly Interest",
        "plan_code": "PLN-GOLD-M"
      }
    ]
  }
}
```

---

### 2. Overdue Collections
Retrieves all collection periods past their scheduled date with outstanding interest unpaid, sorted from longest overdue to newest.

- **Route**: `GET /api/interest-loans/periods/collections/overdue` (or `/api/interest-loan-periods/overdue`)
- **Auth Required**: Bearer Token (`VIEW` action)
- **Query Parameters**:
  - `date` (optional, YYYY-MM-DD): Reference date to calculate overdue from (defaults to today).
  - `min_days_overdue` (optional, integer): E.g. `min_days_overdue=7` or `min_days_overdue=30` (30+ DPD buckets).
  - `search` (optional): Search by loan number, customer ID, customer name, or mobile.

#### Example Request
```http
GET /api/interest-loans/periods/collections/overdue?min_days_overdue=1
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "summary": {
      "reference_date": "2026-09-21",
      "total_overdue_periods": 3,
      "total_loans_overdue": 2,
      "total_overdue_amount": 4500.00,
      "max_days_overdue": 15
    },
    "data": [
      {
        "id": 9,
        "loan_id": 2,
        "period_no": 1,
        "scheduled_date": "2026-09-06",
        "days_overdue": 15,
        "interest_amount": 1500.00,
        "paid_interest_amount": 0.00,
        "outstanding_interest_amount": 1500.00,
        "status": "due",
        "loan_no": "INTL-000002",
        "customer_name": "Vikram Singh",
        "customer_mobile": "9123456789"
      }
    ]
  }
}
```

---

### 3. Unified Collections Overview (Executive Dashboard)
Provides instant summary KPI badges across Today, Overdue, and Upcoming (next 7 days), with optional record list filtering.

- **Route**: `GET /api/interest-loans/periods/collections`
- **Auth Required**: Bearer Token (`VIEW` action)
- **Query Parameters**:
  - `type` (optional): `today`, `overdue`, or `all` (default). When `all`, returns list of both today and overdue records.
  - `date` (optional, YYYY-MM-DD): Target reference date.
  - `search` (optional): Search filter across loans and customers.

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "summary": {
      "today": {
        "date": "2026-09-21",
        "total_records": 12,
        "total_due_amount": 35000.00,
        "total_collected_amount": 10000.00,
        "total_outstanding_amount": 25000.00
      },
      "overdue": {
        "reference_date": "2026-09-21",
        "total_overdue_periods": 3,
        "total_loans_overdue": 2,
        "total_overdue_amount": 4500.00,
        "max_days_overdue": 15
      },
      "upcoming_7_days": {
        "total_records": 8,
        "total_due_amount": 18000.00
      }
    },
    "active_filter": "all",
    "data": {
      "today": [ ... ],
      "overdue": [ ... ]
    }
  }
}
```

---

### 4. Get Periods by Loan ID
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

---

## ⏰ Daily Interest Accrual Cron Job (`12:05 AM`)

### Architecture & Automated Flow
The daily accrual cron runs automatically in the background at **12:05 AM** (`5 0 * * *`) in timezone `Asia/Kolkata` (configurable via `INTEREST_LOAN_CRON_SCHEDULE`).

```
interest_loans
     ↓
status = active
     ↓
next_interest_date <= today
     ↓
generate interest_loan_periods
     ↓
update interest_loans
    last_interest_date
    next_interest_date
    total_interest_accrued
    outstanding_interest
```

### Components
- **Cron Scheduler**: `interestLoanPeriod.cron.js` (uses `node-cron`, initialized in `src/server.js`)
- **Accrual Engine**: `interestLoanPeriodCron.service.js` (isolated ACID transactions with `FOR UPDATE` row locks)

### Manual / On-Demand Execution Endpoint
Allows testing and operator-triggered runs without waiting for midnight:

- **Route**: `POST /api/interest-loans/periods/cron/run` (or `/api/interest-loan-periods/cron/run`)
- **Auth Required**: Bearer Token (`checkPermission("MOD_INTEREST_ONLY_LOANS", "EDIT")`)
- **Request Body (Optional)**:
```json
{
  "date": "2026-10-12",
  "loan_id": 1
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Daily interest accrual cron job executed successfully",
  "data": {
    "execution_date": "2026-10-12",
    "total_eligible": 1,
    "processed": 1,
    "periods_generated": 1,
    "periods_marked_due": 1,
    "successful_loans": [
      {
        "loan_id": 1,
        "loan_no": "INTL-000001",
        "periods_generated": 1,
        "last_interest_date": "2026-10-12",
        "next_interest_date": "2026-11-12",
        "total_interest_accrued": 4000.00,
        "outstanding_interest": 2000.00
      }
    ],
    "errors": []
  }
}
```

