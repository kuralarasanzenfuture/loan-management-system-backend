# Postman API Testing Guide: Interest Loan Payments & Allocations

Comprehensive guide for testing the Anytime Customer Interest Loan Payments & Allocations endpoints (`029_interest_loan_payments` & `030_interest_loan_payment_allocations`).

---

## 1. Setup & Environment Variables

Import `Interest_Loan_Payments_API.postman_collection.json` into Postman.

Set the following collection variables:
| Variable | Default Value | Description |
|---|---|---|
| `baseUrl` | `http://localhost:5000` | Backend API root URL |
| `token` | `YOUR_JWT_ACCESS_TOKEN` | Bearer token from login (`/api/auth/login`) |
| `loanId` | `2` | Target loan ID for payment testing |
| `paymentId` | `1` | Auto-populated by payment test scripts |
| `customerId` | `1` | Customer ID for filtering payments |

---

## 2. Recommended Test Execution Sequence

1. **Preview Allocation (`POST /api/interest-loans/payments/preview`)**:
   - Preview how ₹6,000 will be split across overdue period interest vs principal.
2. **Record Interest Payment (`POST /api/interest-loans/payments`)**:
   - Send ₹6,000 payment for Loan 2 (`INTL-000002`).
   - The test script automatically extracts and sets `{{paymentId}}`.
   - Verify Period 1 status transitions to `'paid'` and `outstanding_interest` becomes 0.
3. **Get Payment Receipt by ID (`GET /api/interest-loans/payments/{{paymentId}}`)**:
   - Verify line-item allocations detail showing `interest` allocation and matching period details.
4. **Record Principal Reduction Payment (`POST /api/interest-loans/payments`)**:
   - Pay ₹11,000 on Loan 3 (`INTL-000003`) to verify ₹1,000 interest settlement + ₹10,000 principal prepaid.
5. **View Portfolio Summary (`GET /api/interest-loans/payments/summary`)**:
   - Verify aggregate collection amounts and payment mode breakdowns.
6. **Reverse Payment (`DELETE /api/interest-loans/payments/{{paymentId}}`)**:
   - Roll back payment allocations.
   - Verify period status reverts to `'due'` and loan balances are restored accurately.
