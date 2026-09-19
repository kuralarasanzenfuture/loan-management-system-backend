# 💳 Loan Payments API Documentation

Comprehensive guide and API reference for the **Loan Payments Module** in the Loan Management System.

---

## 📌 Overview

The **Loan Payments** module handles recording, tracking, auto-allocating, and receipting customer installment payments for micro and commercial loans.

### Key Highlights
- **Automatic `loan_id` Retrieval**: You only need to provide the `installment_id`; the backend automatically retrieves the corresponding `loan_id`. If `loan_id` is also provided, it validates relationship integrity.
- **Sequential `payment_no` Generation**: Concurrently safe payment counter (`payment_no = MAX(payment_no) + 1`) per loan using row-level locking (`SELECT ... FOR UPDATE`).
- **Auto-Allocation (`/pay-loan`)**: Enables paying a lump sum towards a loan. The system automatically finds unpaid installments in chronological order and settles them sequentially.
- **Bulk Batch Processing (`/bulk`)**: Process multiple installment payments atomically in a single database transaction.
- **Auto Loan Completion**: When the final installment of a loan is settled, the loan status is automatically marked as `completed`.
- **Atomic Reversals (`DELETE /:id`)**: Safely undo a payment. Automatically recalculates installment paid amount, balance, and status, and reverts completed loans back to `active`.
- **Printable Receipts (`/receipt/:id`)**: Standardized receipt payload with voucher number (e.g., `RCP-0001-0001`), company details, customer profile, and installment snapshot.

---

## 🔐 Base URL & Authentication

- **Base URL**: `http://localhost:5000/api/loan-payments` (or `{{baseUrl}}/api/loan-payments`)
- **Authentication**: JWT Bearer Token required on all endpoints.

```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

---

## 🗄 Database Schema Reference

```sql
CREATE TABLE IF NOT EXISTS loan_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    installment_id BIGINT NOT NULL,
    payment_no INT NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_mode ENUM ('cash', 'bank', 'upi', 'cheque', 'other') NOT NULL,
    transaction_reference VARCHAR(150) NULL,
    cheque_number VARCHAR(50) NULL,
    remarks TEXT,
    received_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE RESTRICT,
    FOREIGN KEY (installment_id) REFERENCES loan_installments (id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE KEY uq_loan_payment_no (loan_id, payment_no),
    INDEX idx_loan_payment_loan (loan_id),
    INDEX idx_loan_payment_installment (installment_id),
    INDEX idx_loan_payment_date (payment_date),
    INDEX idx_loan_payment_mode (payment_mode)
);
```

---

## 🚀 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/loan-payments` | Pay a single installment (auto-fetches `loan_id`) |
| `POST` | `/api/loan-payments/pay-loan` | Lump-sum auto-allocated payment across loan installments |
| `POST` | `/api/loan-payments/bulk` | Batch payments for multiple installments in one transaction |
| `GET` | `/api/loan-payments` | Paginated payment list with search and filters |
| `GET` | `/api/loan-payments/summary` | Financial summary metrics & mode breakdown |
| `GET` | `/api/loan-payments/receipt/:id` | Printable receipt voucher with company & customer details |
| `GET` | `/api/loan-payments/loan/:loanId` | All payment history for a specific loan |
| `GET` | `/api/loan-payments/installment/:installmentId` | Payment history for a specific installment |
| `GET` | `/api/loan-payments/:id` | Single payment details |
| `DELETE`| `/api/loan-payments/:id` | Revert payment and restore installment/loan balance |

---

## 📖 Detailed Endpoint Reference

### 1. Pay Single Installment
Records a payment against a specific installment.

- **Route**: `POST /api/loan-payments`
- **Auth Required**: Yes

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `installment_id` | Integer | **Yes** | ID of the target installment |
| `payment_amount` | Decimal | **Yes** | Amount paid (must be > 0 and <= installment balance) |
| `payment_mode` | String | **Yes** | One of: `cash`, `bank`, `upi`, `cheque`, `other` |
| `loan_id` | Integer | No | Optional. If provided, verified against `installment.loan_id` |
| `payment_date` | ISO Date / String | No | Defaults to current timestamp |
| `transaction_reference` | String | No | UPI Ref / Bank UTR / Transaction ID (max 150 chars) |
| `cheque_number` | String | No | Cheque number if mode is `cheque` (max 50 chars) |
| `remarks` | String | No | Optional notes |

#### Example Request
```json
{
  "installment_id": 1,
  "payment_amount": 100.00,
  "payment_mode": "cash",
  "transaction_reference": "TXN-CASH-001",
  "remarks": "Received by field agent"
}
{
  "installment_id": 1,
  "payment_amount": 500.00,
  "payment_mode": "upi",
  "transaction_reference": "UPI987654321000",
  "remarks": "PhonePe QR payment"
}
{
  "installment_id": 1,
  "payment_amount": 1000.00,
  "payment_mode": "bank",
  "transaction_reference": "HDFC0001234N20260918",
  "remarks": "Direct bank transfer to collection account"
}
{
  "installment_id": 1,
  "payment_amount": 1500.00,
  "payment_mode": "cheque",
  "cheque_number": "CHQ-004521",
  "transaction_reference": "SBI-CHQ-CLEAR-001",
  "remarks": "State Bank of India clearing cheque"
}

```

#### Example Response (`201 Created`)
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "payment": {
    "id": 1,
    "loan_id": 1,
    "installment_id": 1,
    "payment_no": 1,
    "payment_date": "2026-09-18 10:30:00",
    "payment_amount": "100.00",
    "payment_mode": "cash",
    "transaction_reference": "TXN-CASH-001",
    "cheque_number": null,
    "remarks": "Received by field agent",
    "received_by": 1,
    "loan_no": "LN-2026-000001",
    "customer_id": 1,
    "customer_no": "CUST-000001",
    "customer_name": "Ramesh Kumar",
    "customer_mobile": "9876543210",
    "installment_no": 1,
    "installment_due_date": "2026-09-18",
    "installment_total_due": "110.00",
    "installment_status": "partial",
    "received_by_user": "admin"
  },
  "installment_status": "partial",
  "remaining_balance": 10,
  "loan_completed": false
}
```

---

### 2. Auto-Allocated Loan Payment (Lump-Sum)
Allows paying a lump sum towards a loan. The backend finds all pending/partial installments in chronological order and settles them sequentially.

- **Route**: `POST /api/loan-payments/pay-loan`
- **Auth Required**: Yes

#### Request Body
```json
{
  "loan_id": 1,
  "payment_amount": 2500.00,
  "payment_mode": "bank",
  "payment_date": "2026-09-18T14:15:00.000Z",
  "transaction_reference": "NEFT/HDFC000123/20260918",
  "remarks": "Customer advance lump sum deposit"
}
```

#### Example Response (`201 Created`)
```json
{
  "success": true,
  "message": "Successfully allocated payment across 3 installment(s)",
  "total_paid": 2500,
  "loan_completed": false,
  "allocations": [
    {
      "installment_id": 1,
      "installment_no": 1,
      "allocated_amount": 1000,
      "remaining_balance": 0,
      "status": "paid"
    },
    {
      "installment_id": 2,
      "installment_no": 2,
      "allocated_amount": 1000,
      "remaining_balance": 0,
      "status": "paid"
    },
    {
      "installment_id": 3,
      "installment_no": 3,
      "allocated_amount": 500,
      "remaining_balance": 500,
      "status": "partial"
    }
  ],
  "payment_ids": [2, 3, 4]
}
```

---

### 3. Bulk Pay Installments (Batch Processing)
Submit payments for multiple installments in an atomic database transaction.

- **Route**: `POST /api/loan-payments/bulk`
- **Auth Required**: Yes

#### Request Body
```json
{
  "payments": [
    {
      "installment_id": 3,
      "payment_amount": 333.33,
      "payment_mode": "cash",
      "remarks": "Counter collection"
    },
    {
      "installment_id": 4,
      "payment_amount": 333.33,
      "payment_mode": "upi",
      "transaction_reference": "GPay/Ref89211",
      "remarks": "UPI transfer"
    }
  ]
}
```

#### Example Response (`201 Created`)
```json
{
  "success": true,
  "message": "Successfully processed 2 payments in batch",
  "payments": [
    {
      "payment_id": 5,
      "installment_id": 3,
      "installment_no": 3,
      "loan_id": 1,
      "payment_amount": 333.33,
      "status": "paid"
    },
    {
      "payment_id": 6,
      "installment_id": 4,
      "installment_no": 4,
      "loan_id": 1,
      "payment_amount": 333.33,
      "status": "paid"
    }
  ]
}
```

---

### 4. Get All Payments (Paginated & Filtered)
Retrieve a paginated list of recorded payments.

- **Route**: `GET /api/loan-payments`
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: Page number (Default: `1`)
  - `limit`: Number of records (Default: `10`, Max: `100`)
  - `loan_id`: Filter by loan ID
  - `installment_id`: Filter by installment ID
  - `customer_id`: Filter by customer ID
  - `payment_mode`: Filter by payment mode (`cash`, `bank`, `upi`, `cheque`, `other`)
  - `from_date`: Filter from date (`YYYY-MM-DD`)
  - `to_date`: Filter to date (`YYYY-MM-DD`)
  - `search`: Global keyword search across `loan_no`, `customer_no`, customer name, `mobile`, `transaction_reference`, `cheque_number`

#### Example Request
```http
GET /api/loan-payments?page=1&limit=10&payment_mode=cash&search=LN-2026
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 1,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "loan_id": 1,
      "installment_id": 1,
      "payment_no": 1,
      "payment_date": "2026-09-18 10:30:00",
      "payment_amount": "100.00",
      "payment_mode": "cash",
      "transaction_reference": "TXN-CASH-001",
      "cheque_number": null,
      "remarks": "Received by field agent",
      "received_by": 1,
      "loan_no": "LN-2026-000001",
      "customer_id": 1,
      "customer_no": "CUST-000001",
      "customer_name": "Ramesh Kumar",
      "customer_mobile": "9876543210",
      "installment_no": 1,
      "installment_due_date": "2026-09-18",
      "installment_total_due": "110.00",
      "installment_status": "partial",
      "received_by_user": "admin"
    }
  ]
}
```

---

### 5. Get Payment Summary & Analytics
Retrieves total collections, today's collections, and payment mode breakdown.

- **Route**: `GET /api/loan-payments/summary`
- **Auth Required**: Yes
- **Query Parameters**: `from_date`, `to_date` (optional)

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_payments": 25,
      "total_collected": "45000.00",
      "today_collected": "5200.00",
      "today_payments_count": 4
    },
    "mode_breakdown": [
      { "payment_mode": "cash", "count": 15, "amount": "25000.00" },
      { "payment_mode": "upi", "count": 8, "amount": "15000.00" },
      { "payment_mode": "bank", "count": 2, "amount": "5000.00" }
    ]
  }
}
```

---

### 6. Get Payment Receipt Voucher
Generates printable voucher data formatted with complete loan, company, customer, and installment context.

- **Route**: `GET /api/loan-payments/receipt/:id`
- **Auth Required**: Yes

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "receipt_no": "RCP-0001-0001",
    "payment": {
      "id": 1,
      "loan_id": 1,
      "installment_id": 1,
      "payment_no": 1,
      "payment_date": "2026-09-18 10:30:00",
      "payment_amount": "100.00",
      "payment_mode": "cash",
      "transaction_reference": "TXN-CASH-001",
      "remarks": "Cash collection",
      "loan_no": "LN-2026-000001",
      "loan_amount": "10000.00",
      "total_repayment": "11000.00",
      "loan_start_date": "2026-09-18",
      "loan_end_date": "2026-12-26",
      "loan_status": "active",
      "plan_name": "Daily Micro Business Plan",
      "plan_code": "LP-DAILY-100",
      "collection_frequency": "daily",
      "customer_id": 1,
      "customer_no": "CUST-000001",
      "customer_name": "Ramesh Kumar",
      "customer_mobile": "9876543210",
      "address": "123 Market Street",
      "city": "Chennai",
      "pincode": "600001",
      "installment_no": 1,
      "installment_due_date": "2026-09-18",
      "installment_total_due": "110.00",
      "installment_paid_amount": "100.00",
      "installment_balance_amount": "10.00",
      "installment_status": "partial",
      "received_by_user": "admin"
    },
    "company": {
      "company_name": "Apex Micro Finance Solutions",
      "phone": "+91 98400 12345",
      "email": "contact@apexmfs.com",
      "address_line_1": "Level 4, Financial Towers",
      "city": "Chennai",
      "pincode": "600002",
      "gst_number": "33AAAAA0000A1Z5"
    }
  }
}
```

---

### 7. Get Payments by Loan
Returns sequential payment history for a specific loan.

- **Route**: `GET /api/loan-payments/loan/:loanId`
- **Auth Required**: Yes

#### Example Request
```http
GET /api/loan-payments/loan/1
```

---

### 8. Get Payments by Installment
Returns all partial payments recorded for a specific installment.

- **Route**: `GET /api/loan-payments/installment/:installmentId`
- **Auth Required**: Yes

#### Example Request
```http
GET /api/loan-payments/installment/1
```

---

### 9. Get Single Payment by ID
- **Route**: `GET /api/loan-payments/:id`
- **Auth Required**: Yes

---

### 10. Revert / Delete Payment
Atomically cancels a payment. Automatically decreases the installment's `paid_amount`, restores its `balance_amount`, resets its `status` (e.g. back to `partial` or `pending`), restores `loans.status = 'active'` if the loan had completed, and deletes the payment record.

- **Route**: `DELETE /api/loan-payments/:id`
- **Auth Required**: Yes

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Payment #1 successfully reverted",
  "reverted_amount": 100,
  "installment_id": 1,
  "loan_id": 1
}
```

---

## 📂 Importing into Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select the file:
   `src/modules/loanPayments/postman/Loan_Payments_API.postman_collection.json`
4. Set your collection variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: `<your_valid_jwt_access_token>`
5. You are ready to test all payment flows!
