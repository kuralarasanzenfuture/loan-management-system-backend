# 🏦 Customer Interest Loans API Documentation

Comprehensive guide, database schema reference, business lifecycle documentation, and Postman reference for the **Customer Interest Loans & Periods Module** (`027_interest_loans.sql` & `028_interest_loan_periods.sql`) in the Loan Management System.

---

## 📌 Overview

The **Interest Loans** module handles customer anytime interest-based loans with **fully automated, banking-grade lifecycle management**. 

Customers pay interest periodically (daily, weekly, monthly, or yearly) and can repay principal at any time without rigid tenure lock-ins.

### 🌟 Key Automations & Highlights
1. **Strict System-Driven Lifecycle & Payment Guards**:
   - Loan status starts at `'active'` and transitions to `'completed'` automatically when balances are fully settled.
   - **Update Guard**: If any payments have been recorded for a loan, modifying financial terms (`principal_amount`, `start_date`, `interest_plan_id`) is **strictly prohibited**. Only non-financial details (like `remarks`) can be updated.
   - **Delete Guard**: Loans with recorded payments **cannot be deleted**. Financial accounting history is permanently preserved.
2. **Concurrency-Safe Sequential Loan Numbering**:
   - Concurrency-safe, race-condition-proof sequence generation: `INTL-000001`, `INTL-000002`, etc., using row-level locks (`SELECT ... FOR UPDATE`).
3. **Automated Period 1 Scheduling**:
   - On loan creation, the system snapshots the plan parameters (`interest_type`, `interest_rate`, `interest_frequency`, `principal_basis`, `calculation_method`).
   - Automatically computes `next_interest_date` based on frequency.
   - Automatically calculates the first period's interest amount.
   - Inserts Period 1 into `interest_loan_periods` in the same atomic database transaction.
   - If an uncollected loan is updated, Period 1 is automatically recalculated with the new principal and target dates.
4. **Dynamic Calendar-Based Due Date Synchronization**:
   - Every fetch (`GET /` or `GET /:id`) checks the collection dates against `CURRENT_DATE()` and automatically advances upcoming `'pending'` periods to `'due'`.

---

## 🔐 Base URL, Routing & Authentication

- **Base URL**: `http://localhost:5000/api/interest-loans` (or `{{baseUrl}}/api/interest-loans`)
- **Period Sub-Route**: `http://localhost:5000/api/interest-loans/periods` (or `{{baseUrl}}/api/interest-loans/periods`)
- **Authentication**: JWT Bearer Token required on all endpoints.
- **Permission Module Code**: `MOD_INTEREST_ONLY_LOANS`

```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

### Role Permissions Required

| Endpoint | Method | Required Action Code | Description |
|---|---|---|---|
| `/api/interest-loans` | `POST` | `CREATE` | Open new interest loan account |
| `/api/interest-loans/summary` | `GET` | `VIEW` | View portfolio summary metrics |
| `/api/interest-loans` | `GET` | `VIEW` | List interest loans with filters & pagination |
| `/api/interest-loans/:id` | `GET` | `VIEW` | View loan details + periods schedule |
| `/api/interest-loans/customer/:customer_id` | `GET` | `VIEW` | View all loans for a specific customer |
| `/api/interest-loans/:id` | `PUT` | `EDIT` | Update loan (guarded if payments exist) |
| `/api/interest-loans/:id` | `DELETE` | `DELETE` | Delete loan (rejected if payments exist) |
| `/api/interest-loans/periods/loan/:loan_id` | `GET` | `VIEW` | View period schedule for a loan |
| `/api/interest-loans/periods/:id` | `GET` | `VIEW` | View single period details |

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/interest-loans` | Create new loan account (auto-computes INTL & Period 1) |
| `GET` | `/api/interest-loans/summary` | Get portfolio summary metrics |
| `GET` | `/api/interest-loans` | Get all loans (search, date filters, pagination) |
| `GET` | `/api/interest-loans/:id` | Get loan details by ID + periods schedule array |
| `GET` | `/api/interest-loans/customer/:customer_id` | Get all loans for a specific customer |
| `PUT` | `/api/interest-loans/:id` | Update loan (financial fields locked if payments exist) |
| `DELETE`| `/api/interest-loans/:id` | Delete loan (blocked if payments exist) |
| `GET` | `/api/interest-loans/periods/loan/:loan_id` | Get period collection schedule for a loan |

---

## 📖 Detailed Endpoint Reference

### 1. Create Customer Interest Loan
Opens a new interest loan account. Customer must be active and plan must be active. 

- **Route**: `POST /api/interest-loans`
- **Auth Required**: Bearer Token (`CREATE` action on `MOD_INTEREST_ONLY_LOANS`)

#### Example Request
```json
{
  "customer_id": 1,
  "interest_plan_id": 1,
  "principal_amount": 100000.00,
  "start_date": "2026-09-12",
  "remarks": "Anytime interest loan on reducing balance"
}
```

#### Example Response (`201 Created`)
```json
{
  "success": true,
  "message": "Interest loan created successfully",
  "data": {
    "id": 1,
    "loan_no": "INTL-000001",
    "customer_id": 1,
    "customer_name": "Suresh Kumar",
    "principal_amount": "100000.00",
    "outstanding_principal": "100000.00",
    "status": "active",
    "next_interest_date": "2026-10-12",
    "periods": [
      {
        "id": 1,
        "period_no": 1,
        "opening_principal": "100000.00",
        "interest_amount": "2000.00",
        "status": "pending"
      }
    ]
  }
}
```

---

### 2. Get Portfolio Summary Metrics
Retrieves aggregated financial metrics across all interest loans.

- **Route**: `GET /api/interest-loans/summary`
- **Auth Required**: Bearer Token (`VIEW` action)

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "total_loans": 5,
    "active_loans": 4,
    "completed_loans": 1,
    "closed_loans": 0,
    "cancelled_loans": 0,
    "total_principal_disbursed": "575000.00",
    "total_outstanding_principal": "495000.00",
    "total_principal_collected": "80000.00",
    "total_interest_accrued": "12000.00",
    "total_interest_collected": "6000.00",
    "total_outstanding_interest": "6000.00"
  }
}
```

---

### 3. Update Interest Loan (Payment-Guarded)
Updates loan parameters.

- **Route**: `PUT /api/interest-loans/:id`
- **Auth Required**: Bearer Token (`EDIT` action)

#### Validation Rules:
- **If NO payments have been made**: Can modify `principal_amount`, `start_date`, `interest_plan_id`, and `remarks`. Period 1 will be automatically recomputed and updated.
- **If ANY payment has been made**: Modifying `principal_amount`, `start_date`, or `interest_plan_id` will be **rejected with HTTP 400**. Only `remarks` can be updated.

#### Example Request (Before Payments)
```json
{
  "principal_amount": 120000.00,
  "remarks": "Revised loan principal before payments started."
}
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Interest loan updated successfully",
  "data": {
    "id": 1,
    "principal_amount": "120000.00",
    "outstanding_principal": "120000.00",
    "remarks": "Revised loan principal before payments started.",
    "periods": [
      {
        "period_no": 1,
        "opening_principal": "120000.00",
        "interest_amount": "2400.00"
      }
    ]
  }
}
```

#### Error Response when payments exist (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot modify principal amount, start date, or loan plan because payments have already been recorded for this loan."
}
```

---

### 4. Delete Interest Loan (Payment-Guarded)
Deletes an uncollected interest loan and its associated unbilled period(s).

- **Route**: `DELETE /api/interest-loans/:id`
- **Auth Required**: Bearer Token (`DELETE` action)

#### Validation Rules:
- **If payments have been made**: Deletion is **strictly blocked** with HTTP 400.
- **If no payments have been made**: Deletes the loan and Period 1 cleanly in an atomic transaction.

#### Example Successful Response (`200 OK`)
```json
{
  "success": true,
  "id": "1",
  "message": "Interest loan deleted successfully"
}
```

#### Error Response when payments exist (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete loan: payments have already been recorded for this loan. Financial accounting history cannot be deleted."
}
```

---

## 📂 Importing into Postman

1. Open **Postman**.
2. Click **Import** (top-left).
3. Select `src/modules/interestLoan/loan/postman/Interest_Loans_API.postman_collection.json`.
4. Set your Collection Variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: `<your_valid_jwt_access_token>`
   - `loanId`: `1`
   - `customerId`: `1`
   - `planId`: `1`
5. You are ready to test all interest loan operations!
