# 📋 Interest Loan Plan API Documentation

Comprehensive guide, schema reference, and Postman testing documentation for the **Interest Loan Plan Module** (`026_interest_loan_plans.sql`) in the Loan Management System.

---

## 📌 Overview

The **Interest Loan Plan** module defines product configurations for anytime interest-based loans. Plans act as templates when issuing new customer interest loans, governing:
- **Calculation Method**: Simple interest calculations (`simple`).
- **Principal Basis**: Whether periodic interest is calculated on `original_principal` (flat on disbursed sum) or `outstanding_principal` (reducing balance as principal is paid down).
- **Frequency**: Collection cycles supporting `daily`, `weekly`, `monthly`, and `yearly`.
- **Payment Type**: `anytime` flexible settlement without rigid lock-in periods.
- **Smart Plan Codes**: Auto-generated human-readable plan codes (e.g., `INT-MONTHLY-2`, `INT-WEEKLY-1`) or custom assigned codes.

---

## 🔐 Base URL, Routing & Authentication

- **Direct Endpoints**: `http://localhost:5000/api/interest-loan-plans` (or `{{baseUrl}}/api/interest-loan-plans`)
- **Domain Aggregated**: `http://localhost:5000/api/interest-loans/plans` (or `{{baseUrl}}/api/interest-loans/plans`)
- **Authentication**: JWT Bearer Token required on all endpoints.
- **Permission Module Code**: `MOD_INTEREST_LOAN_PLANS`

```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

### Role Permissions Required

| Endpoint | Method | Required Action Code | Description |
|---|---|---|---|
| `/api/interest-loan-plans` | `POST` | `CREATE` | Create new interest loan plan |
| `/api/interest-loan-plans` | `GET` | `VIEW` | List all plans with filters & pagination |
| `/api/interest-loan-plans/active` | `GET` | `VIEW` | Fast query for loan creation dropdowns |
| `/api/interest-loan-plans/:id` | `GET` | `VIEW` | View plan details and audit info |
| `/api/interest-loan-plans/:id` | `PUT` | `EDIT` | Update plan rate, name, description |
| `/api/interest-loan-plans/:id/status` | `PATCH` | `EDIT` | Toggle plan active / inactive status |
| `/api/interest-loan-plans/:id` | `DELETE` | `DELETE` | Delete unused plan (guarded against active loans) |

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

## 🚀 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/interest-loan-plans` | Create a new interest loan plan (auto or custom code) |
| `GET` | `/api/interest-loan-plans` | Paginated and filtered list of all plans |
| `GET` | `/api/interest-loan-plans/active` | Get active plans only (for loan form dropdown selection) |
| `GET` | `/api/interest-loan-plans/:id` | Get plan details by ID with creator & updater info |
| `PUT` | `/api/interest-loan-plans/:id` | Update plan rate, name, description, etc. |
| `PATCH`| `/api/interest-loan-plans/:id/status` | Update plan status (`active` / `inactive`) |
| `DELETE`| `/api/interest-loan-plans/:id` | Delete plan (guarded: rejected if linked to any loans) |

---

## 📖 Detailed Endpoint Reference

### 1. Create Interest Loan Plan
Creates a new plan configuration. If `plan_code` is not provided, the backend automatically generates a readable, unique plan code based on the frequency and interest value (e.g. `INT-MONTHLY-2`).

- **Route**: `POST /api/interest-loan-plans`
- **Auth Required**: Bearer Token (`CREATE` action on `MOD_INTEREST_LOAN_PLANS`)

#### Request Body
| Field | Type | Required | Default | Allowed Values / Validation |
|---|---|---|---|---|
| `plan_name` | String | **Yes** | — | Unique, 1–100 characters |
| `plan_code` | String | No | Auto-generated | Unique, uppercase, max 50 chars |
| `interest_type` | String | No | `'percentage'` | `'percentage'`, `'fixed'` |
| `interest_value` | Number | **Yes** | — | Decimal &ge; 0 (e.g. `2.0` for 2%) |
| `interest_frequency` | String | No | `'monthly'` | `'daily'`, `'weekly'`, `'monthly'`, `'yearly'` |
| `calculation_method` | String | No | `'simple'` | `'simple'` |
| `principal_basis` | String | No | `'outstanding_principal'` | `'original_principal'`, `'outstanding_principal'` |
| `payment_type` | String | No | `'anytime'` | `'anytime'` |
| `description` | String | No | `null` | Optional text notes |
| `status` | String | No | `'active'` | `'active'`, `'inactive'` |

#### Example Request (Auto Plan Code)
```json
{
  "plan_name": "Monthly 2% Simple",
  "interest_type": "percentage",
  "interest_value": 2.0,
  "interest_frequency": "monthly",
  "calculation_method": "simple",
  "principal_basis": "outstanding_principal",
  "payment_type": "anytime",
  "description": "Standard monthly 2% interest plan on outstanding principal with anytime settlement.",
  "status": "active"
}
```

#### Example Response (`201 Created`)
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
    "description": "Standard monthly 2% interest plan on outstanding principal with anytime settlement.",
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

### 2. Get All Plans (Filtered & Paginated)
Retrieves a paginated list of all loan plans.

- **Route**: `GET /api/interest-loan-plans`
- **Auth Required**: Bearer Token (`VIEW` action)

#### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | Page number |
| `limit` | Integer | — | Items per page (enables pagination payload if passed) |
| `status` | String | — | Filter by status (`active`, `inactive`) |
| `interest_type` | String | — | Filter by interest type (`percentage`, `fixed`) |
| `interest_frequency` | String | — | Filter by frequency (`daily`, `weekly`, `monthly`, `yearly`) |
| `principal_basis` | String | — | Filter by basis (`original_principal`, `outstanding_principal`) |
| `search` | String | — | Keyword search across `plan_name` and `plan_code` |

#### Example Request
```http
GET /api/interest-loan-plans?status=active&interest_frequency=monthly&page=1&limit=10
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "plans": [
      {
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
        "description": "Standard monthly 2% interest plan",
        "created_by": 1,
        "created_by_name": "admin",
        "updated_by": null,
        "updated_by_name": null,
        "created_at": "2026-09-21T11:57:00.000Z",
        "updated_at": "2026-09-21T11:57:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Active Plans (Dropdown Selector)
Optimized lightweight list of currently active plans for loan creation forms.

- **Route**: `GET /api/interest-loan-plans/active`
- **Auth Required**: Bearer Token (`VIEW` action)

#### Example Response (`200 OK`)
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

### 4. Get Plan By ID
Returns full details of a specific plan by its primary ID.

- **Route**: `GET /api/interest-loan-plans/:id`
- **Auth Required**: Bearer Token (`VIEW` action)

#### Example Request
```http
GET /api/interest-loan-plans/1
```

---

### 5. Update Plan
Updates plan properties. At least one field is required.

- **Route**: `PUT /api/interest-loan-plans/:id`
- **Auth Required**: Bearer Token (`EDIT` action)

#### Example Request
```json
{
  "plan_name": "Monthly 2.5% Revised",
  "interest_value": 2.5,
  "description": "Revised monthly interest loan rate to 2.5%."
}
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Interest loan plan updated successfully",
  "data": {
    "id": 1,
    "plan_name": "Monthly 2.5% Revised",
    "plan_code": "INT-MONTHLY-2",
    "interest_value": "2.5000",
    "updated_by": 1,
    "updated_by_name": "admin",
    "updated_at": "2026-09-21T12:30:00.000Z"
  }
}
```

---

### 6. Update Plan Status
Toggles the plan between `active` and `inactive`.

- **Route**: `PATCH /api/interest-loan-plans/:id/status`
- **Auth Required**: Bearer Token (`EDIT` action)

#### Request Body
```json
{
  "status": "inactive"
}
```

#### Example Response (`200 OK`)
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

---

### 7. Delete Plan
Deletes a loan plan record. If any active or completed interest loans in `interest_loans` reference this plan (`interest_plan_id`), deletion is **automatically rejected** with HTTP 400 to preserve historical accounting integrity.

- **Route**: `DELETE /api/interest-loan-plans/:id`
- **Auth Required**: Bearer Token (`DELETE` action)

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "id": "1",
  "message": "Interest loan plan deleted successfully"
}
```

#### Guarded Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Cannot delete plan: it is currently linked to one or more interest loans"
}
```

---

## 📂 Postman Import Instructions

1. Open **Postman**.
2. Click **Import** (top-left).
3. Choose the file:
   `src/modules/interestLoan/plan/postman/Interest_Loan_Plan_API.postman_collection.json`
4. Set the Collection Variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: `<your_valid_jwt_access_token>`
   - `planId`: `1` (automatically updated when executing Create Plan)
5. Execute requests directly from the collection!
