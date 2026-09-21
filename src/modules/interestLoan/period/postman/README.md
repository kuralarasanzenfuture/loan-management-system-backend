# 📋 Interest Loan Periods API - Postman Collection & Guide

Postman reference for the **Interest Loan Periods Module** (`028_interest_loan_periods.sql`).

---

## 📌 Overview

Allows frontends and mobile clients to inspect upcoming and past billing periods, scheduled due dates, and remaining outstanding balances for customer anytime interest loans.

---

## 🔐 Base URL & Authentication

- **Base URL**: `{{baseUrl}}/api/interest-loans/periods`
- **Direct Alias**: `{{baseUrl}}/api/interest-loan-periods`
- **Authentication**: JWT Bearer Token required (`checkPermission("MOD_INTEREST_ONLY_LOANS", "VIEW")`).

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 🚀 Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/interest-loans/periods/loan/:loan_id` | Get all collection periods for a loan |
| `GET` | `/api/interest-loan-periods/loan/:loan_id` | Direct alias for loan period schedule |
| `GET` | `/api/interest-loans/periods/:id` | Get single period details by ID |
| `GET` | `/api/interest-loan-periods/:id` | Direct alias for single period details |

---

## 📂 Importing into Postman

1. Open **Postman**.
2. Click **Import** &rarr; Select `src/modules/interestLoan/period/postman/Interest_Loan_Periods_API.postman_collection.json`.
3. Set variables: `baseUrl`, `token`, `loanId`, `periodId`.
