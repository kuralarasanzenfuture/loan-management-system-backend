# 📋 Interest Loan Plan API - Postman Collection & Guide

Documentation and Postman collection reference for the **Interest Loan Plan Module** (`026_interest_loan_plans.sql`).

---

## 📌 Overview

The **Interest Loan Plan** module defines and manages loan configurations for anytime interest loans. Plans configure:
- Interest calculation frequency (`daily`, `weekly`, `monthly`, `yearly`)
- Interest type (`percentage`, `fixed`) and rate value
- Calculation method (`simple`)
- Principal basis (`original_principal`, `outstanding_principal`)
- Payment type (`anytime`)
- Auto-generated or custom human-readable plan codes (e.g. `INT-MONTHLY-2`, `INT-MONTHLY-3`, `INT-WEEKLY-1`)

---

## 🔐 Base URL & Authentication

- **Direct Endpoints**: `{{baseUrl}}/api/interest-loan-plans`
- **Domain Aggregated Endpoints**: `{{baseUrl}}/api/interest-loans/plans`
- **Authentication**: JWT Bearer Token required on all endpoints.

```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/interest-loan-plans` | Create a new interest loan plan |
| `GET` | `/api/interest-loan-plans` | Get all plans (filters: status, frequency, type, basis, pagination) |
| `GET` | `/api/interest-loan-plans/active` | Get active plans only (for loan form dropdown selection) |
| `GET` | `/api/interest-loan-plans/:id` | Get plan details by ID with creator/updater info |
| `PUT` | `/api/interest-loan-plans/:id` | Update plan fields (name, value, description, etc.) |
| `PATCH`| `/api/interest-loan-plans/:id/status` | Update status (`active` / `inactive`) |
| `DELETE`| `/api/interest-loan-plans/:id` | Delete plan (guarded: blocked if linked to any loans) |

---

## 📂 Importing into Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select the file:
   `src/modules/interestLoan/plan/postman/Interest_Loan_Plan_API.postman_collection.json`
4. Set the Collection Variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: `<your_valid_jwt_access_token>`
   - `planId`: `1` (automatically set on creating a plan)
5. You can now execute all requests!

---

## 📖 Request & Response Samples

### 1. Create Plan (Auto Code)
**`POST /api/interest-loan-plans`**

#### Request:
```json
{
  "plan_name": "Monthly 2% Simple",
  "interest_type": "percentage",
  "interest_value": 2.0,
  "interest_frequency": "monthly",
  "calculation_method": "simple",
  "principal_basis": "outstanding_principal",
  "payment_type": "anytime",
  "description": "Standard monthly 2% interest plan on outstanding balance",
  "status": "active"
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "message": "Interest loan plan created successfully",
  "data": {
    "id": 1,
    "plan_name": "Monthly 2% Simple",
    "plan_code": "INT-MONTHLY-2",
    "interest_type": "percentage",
    "interest_value": "2.0000",
    "interest_frequency": "monthly",
    "calculation_method": "simple",
    "principal_basis": "outstanding_principal",
    "payment_type": "anytime",
    "status": "active",
    "description": "Standard monthly 2% interest plan on outstanding balance",
    "created_by": 1,
    "created_by_name": "admin",
    "updated_by": null,
    "updated_by_name": null,
    "created_at": "2026-09-21T11:57:00.000Z",
    "updated_at": "2026-09-21T11:57:00.000Z"
  }
}
```

---

### 2. Get Active Plans (Dropdown)
**`GET /api/interest-loan-plans/active`**

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "plan_name": "Monthly 2% Simple",
      "plan_code": "INT-MONTHLY-2",
      "interest_type": "percentage",
      "interest_value": "2.0000",
      "interest_frequency": "monthly",
      "calculation_method": "simple",
      "principal_basis": "outstanding_principal",
      "status": "active"
    }
  ]
}
```

---

### 3. Update Plan Status
**`PATCH /api/interest-loan-plans/:id/status`**

#### Request:
```json
{
  "status": "inactive"
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Plan status updated to inactive successfully",
  "data": {
    "id": 1,
    "status": "inactive"
  }
}
```
