# ⏰ Production Interest Loan Accrual & Financial Integrity Engine

The **Interest Loan Cron Engine** handles automated daily interest accrual, multi-period downtime catch-up, keyset batch processing, distributed multi-instance locking, immutable audit logging, and independent financial reconciliation for the loan management system.

---

## 📌 Architecture Overview

The system operates across a **5-tier pipeline** designed with strict financial system principles: transaction atomicity, mathematical determinism, $O(1)$ bounded memory, zero date drift, and layered defense against concurrent corruption.

```
                    ┌──────────────────────────────────────────────────┐
                    │               Tier 1: Schedulers                 │
                    │   Accrual: '5 0 * * *'  |  Recon: '0 2 * * *'    │
                    │   * node-cron trigger only (no financial logic)  │
                    └─────────────────────────┬────────────────────────┘
                                              │
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │         Tier 2: Distributed Advisory Lock        │
                    │   GET_LOCK('interest_loan_accrual_cron_lock', 0) │
                    │   * Dedicated connection, multi-node exclusion   │
                    └─────────────────────────┬────────────────────────┘
                                              │
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │          Tier 3: Keyset Batch Orchestrator       │
                    │   WHERE status='active' AND id > ? ... LIMIT 50  │
                    │   * Bounded memory proportional to batch size    │
                    │   * Periodic heartbeat updates per batch         │
                    └─────────────────────────┬────────────────────────┘
                                              │
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │            Tier 4: Loan Domain Service           │
                    │   * Zero-drift calendar anchor calculation       │
                    │   * Deadlock retry wrapper (1213/1205 backoff)   │
                    │   * Circuit-breaker bounded catch-up (MAX: 100)  │
                    └─────────────────────────┬────────────────────────┘
                                              │
                                              ▼
                    ┌──────────────────────────────────────────────────┐
                    │          Tier 5: Database Transaction            │
                    │   1. SELECT loan FOR UPDATE (Row Lock)           │
                    │   2. SELECT latest period FOR UPDATE             │
                    │   3. INSERT period (UNIQUE constraint defense)   │
                    │   4. UPDATE loan snapshot balances (Delta)       │
                    │   5. INSERT financial_audit_logs (Append-only)   │
                    │   6. COMMIT (Rollback atomically on any failure) │
                    └──────────────────────────────────────────────────┘
```

---

## 📂 File Map & Responsibilities

| File | Primary Responsibility |
| :--- | :--- |
| [`interestLoanCron.scheduler.js`](./interestLoanCron.scheduler.js) | Registers cron triggers (12:05 AM Accrual, 2:00 AM Reconciliation), enforces local thread mutexes, handles timezone configuration, and exports clean lifecycle hooks. |
| [`interestLoanAccrual.job.js`](./interestLoanAccrual.job.js) | Acquires the MySQL distributed advisory lock on a dedicated connection, executes keyset batch streaming, updates heartbeats, records metrics in `cron_job_logs`, and runs the stale job watchdog. |
| [`interestLoanAccrual.service.js`](./interestLoanAccrual.service.js) | Implements financial domain logic: anchor-based billing cycle calculations, multi-period catch-up loops, circuit breakers, row locks, delta snapshot updates, and transaction deadlock retries. |
| [`interestLoanCron.controller.js`](./interestLoanCron.controller.js) | Handles HTTP endpoints for health status, paginated job logs, manual accrual runs, manual reconciliation triggers, and discrepancy reports. |
| [`interestLoanCron.routes.js`](./interestLoanCron.routes.js) | Defines Express API routing, secures endpoints with JWT authentication (`verifyToken`), RBAC permissions (`checkPermission`), rate limiting (`express-rate-limit`), and idempotency (`requireIdempotency`). |
| [`../reconciliation/interestLoanReconciliation.service.js`](../reconciliation/interestLoanReconciliation.service.js) | Independent financial audit engine validating 7 mathematical ledger invariants across loans, periods, and payment ledgers. |
| [`../../../utils/financialMath.js`](../../../utils/financialMath.js) | Deterministic BigInt fixed-point arithmetic utility with exact commercial `ROUND_HALF_UP` rounding to 2 decimal places (eliminates IEEE-754 floating-point errors). |

---

## 🧮 Core Financial Principles & Algorithms

### 1. Deterministic Decimal Fixed-Point Arithmetic
All monetary calculations are performed using string-based inputs and BigInt fixed-point scaling ($10^6$ internal scale):
- **Precision**: 2 decimal places for currency (`DECIMAL(15, 2)`), 4 decimal places for interest rates (`DECIMAL(12, 4)`).
- **Rounding Policy**: Commercial `ROUND_HALF_UP` (round half away from zero).
  - $0.005 \to 0.01$, $0.0049 \to 0.00$.
  - $-0.005 \to -0.01$, $-0.0049 \to 0.00$.
  - Zero Protection: Values between $-0.0049$ and $0.00$ produce `"0.00"`, never `"-0.00"`.
- **Single-Step Reduction**: Interest calculations perform division with full intermediate precision before rounding:
  $$\text{Interest} = \frac{\text{OpeningPrincipal} \times \text{InterestRate}}{100}$$

### 2. Zero Date Drift Calendar Anchor Math
Standard date addition (`date.add(1, 'month')`) suffers from cumulative date drift (e.g. Jan 31 $\to$ Feb 28 $\to$ Mar 28).

`computeCycleDate(anchorStartDate, cycleNumber, frequency)` solves this by anchoring all future dates strictly to the loan's inception date (`loan.start_date`):
```javascript
// Anchor: 2026-01-31 (Monthly)
computeCycleDate("2026-01-31", 1, "monthly"); // -> 2026-02-28 (clamped to end of Feb)
computeCycleDate("2026-01-31", 2, "monthly"); // -> 2026-03-31 (restored to 31st!)
computeCycleDate("2026-01-31", 3, "monthly"); // -> 2026-04-30 (clamped to end of Apr)
computeCycleDate("2026-01-31", 4, "monthly"); // -> 2026-05-31 (restored to 31st!)
```

Leap years (`2024-02-29`) preserve February 29 on 4-year leap cycles while clamping cleanly to February 28 on non-leap years.

### 3. Server Downtime Multi-Period Catch-Up & Circuit Breaker
If the cron or server was offline for days or months:
1. `processSingleLoanAccrual` detects that `next_interest_date <= today`.
2. A sequential loop generates all overdue periods in strict chronological order with the correct opening principal and calculated interest.
3. **Circuit Breaker**: If overdue periods exceed `INTEREST_LOAN_MAX_CATCHUP_PERIODS` (default: 100):
   - The loop terminates safely.
   - `circuit_breaker_tripped = true` is flagged.
   - `next_interest_date` is preserved at the ungenerated cycle (no dates are skipped or fabricated).
   - An alert event with action `RECOVERY_REQUIRED` is logged to `financial_audit_logs`.

---

## 🔒 Concurrency, Locking & Scalability

### 1. Multi-Instance Distributed Advisory Lock
To prevent duplicate job execution in clustered or containerized deployments:
- Uses MySQL advisory lock: `SELECT GET_LOCK('interest_loan_accrual_cron_lock:${NODE_ENV}', 0)` on a dedicated connection.
- `timeout = 0` guarantees immediate return without blocking worker threads.
- If locked, competing instances exit immediately with `LOCKED_BY_ANOTHER_INSTANCE`.
- Lock release is guaranteed in the `finally` block on the same connection.

### 2. Transactional Row Locks & Sequence Invariants
Every financial mutation acquires exclusive pessimistic locks:
1. `SELECT * FROM interest_loans WHERE id = ? FOR UPDATE`
2. `SELECT * FROM interest_loan_periods WHERE loan_id = ? ORDER BY period_no DESC LIMIT 1 FOR UPDATE`

This guarantees that concurrent manual API requests and background workers serialize cleanly.

### 3. Database Uniqueness (Final Defense)
Even if an application-level check is bypassed, the database schema enforces:
- `uq_interest_period`: `UNIQUE KEY (loan_id, period_no)`
- `uq_interest_period_date`: `UNIQUE KEY (loan_id, scheduled_date)`

Duplicate concurrent insertions trigger `ER_DUP_ENTRY` (1062), which is caught and gracefully resolved by reloading the existing period record.

### 4. Keyset Batch Streaming ($O(1)$ Memory)
Rather than loading all eligible loans into memory, the job processes in chunks of 50 using keyset pagination:
```sql
SELECT id, loan_no, next_interest_date 
FROM interest_loans FORCE INDEX (idx_interest_loan_keyset_v2)
WHERE status = 'active' 
  AND id > ?
  AND next_interest_date IS NOT NULL 
  AND next_interest_date <= ? 
ORDER BY id ASC 
LIMIT 50;
```
Backed by composite index `idx_interest_loan_keyset_v2 (status, id, next_interest_date)`, `EXPLAIN` confirms `type: range, Extra: Using index condition` with **zero filesort**.

### 5. Transactional Deadlock Retry (`executeWithRetry`)
When concurrent payment transactions and accrual jobs collide, InnoDB may raise:
- `ER_LOCK_DEADLOCK` (1213)
- `ER_LOCK_WAIT_TIMEOUT` (1205)

`executeWithRetry` captures these transient errors, rolls back the failed transaction, applies exponential backoff with random jitter ($50 \times 2^{\text{attempt}} + \text{jitter}$ ms), and restarts the entire transaction from scratch (up to 3 retries).

---

## 📊 Audit Trail & Independent Reconciliation

### 1. Append-Only Financial Audit Ledger (`financial_audit_logs`)
Every period generation writes an immutable audit record within the same transaction:
- `audit_id`: Unique UUIDv4.
- `loan_id`, `period_id`: Affected entities.
- `action`: `ACCRUAL_GENERATED` or `RECOVERY_REQUIRED`.
- `actor_type`: `SYSTEM_CRON` or `USER`.
- `before_state`: Snapshot of balances and dates before mutation.
- `after_state`: Snapshot of balances and dates after mutation.

### 2. Independent Reconciliation Engine
Scheduled daily at 2:00 AM (or on-demand via API), `InterestLoanReconciliationService` verifies 7 ledger invariants without using the generator code:
1. `loan.total_interest_accrued` $\equiv \sum \text{period.interest\_amount}$
2. `loan.total_interest_paid` $\equiv \sum \text{period.paid\_interest\_amount}$
3. `loan.total_interest_paid` $\equiv \sum \text{payment.interest\_amount}$
4. `loan.total_principal_paid` $\equiv \sum \text{payment.principal\_amount}$
5. `loan.outstanding_principal` $\equiv \text{loan.principal\_amount} - \text{loan.total\_principal\_paid}$
6. `loan.outstanding_interest` $\equiv \text{loan.total\_interest_accrued} - \text{loan.total\_interest\_paid}$
7. Period sequence contiguous from 1 with no gaps and no duplicate scheduled dates.

Reports are cataloged in `reconciliation_reports`, and itemized issues are saved in `reconciliation_discrepancies` categorized by severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

---

## 🛡️ Idempotency & Rate Limiting

### Request Idempotency Middleware (`requireIdempotency`)
Mutating endpoints (`POST /run` and `POST /reconcile`) support the `Idempotency-Key` HTTP header:
- Computes SHA-256 hash of `[method, path, body, query, userId]`.
- **First Request**: Executes normally, caches response body and status code with a 24-hour TTL (`X-Cache: IDEMPOTENT-MISS`).
- **Exact Replay**: Same key + same payload immediately returns the cached response (`X-Cache: IDEMPOTENT-HIT`).
- **Payload Tampering**: Same key + different payload returns `409 Conflict`.

### Rate Limiting
Manual trigger endpoints are throttled via `express-rate-limit` to **10 requests per minute per IP** to prevent accidental bursts or denial-of-service attempts.

---

## 🌐 API Reference

All routes are mounted at `/api/interest-loans/cron/`:

### 1. Health & Execution Status
```http
GET /api/interest-loans/cron/status
Authorization: Bearer <token>
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "current_date": "2026-09-22",
    "scheduler_active": true,
    "ran_today": true,
    "latest_execution": {
      "id": 15,
      "execution_date": "2026-09-22",
      "status": "SUCCESS",
      "duration_ms": 128,
      "processed_count": 10,
      "periods_generated": 2,
      "failed_count": 0
    },
    "health_status": "HEALTHY"
  }
}
```

### 2. Execution Audit Logs
```http
GET /api/interest-loans/cron/logs?page=1&limit=20
Authorization: Bearer <token>
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "job_name": "interest_loan_daily_accrual",
      "environment": "production",
      "execution_date": "2026-09-22",
      "start_time": "2026-09-22 00:05:00",
      "end_time": "2026-09-22 00:05:01",
      "duration_ms": 128,
      "status": "SUCCESS",
      "total_eligible": 10,
      "processed_count": 10,
      "periods_generated": 2,
      "failed_count": 0,
      "summary": {
        "total_eligible": 10,
        "processed": 10,
        "periods_generated": 2,
        "failed": 0,
        "circuit_breaker_trips": 0,
        "duration_ms": 128,
        "batches": 1
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 3. Manual Accrual Trigger
```http
POST /api/interest-loans/cron/run
Authorization: Bearer <token>
Idempotency-Key: manual-accrual-2026-09-22-uuid
Content-Type: application/json

{
  "target_date": "2026-09-22"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daily interest accrual job completed successfully",
  "data": {
    "job_id": 16,
    "environment": "production",
    "execution_date": "2026-09-22",
    "total_eligible": 10,
    "processed_count": 10,
    "periods_generated": 0,
    "failed_count": 0,
    "circuit_breaker_trips": 0,
    "status": "SUCCESS",
    "duration_ms": 52
  }
}
```

### 4. Manual Reconciliation Trigger
```http
POST /api/interest-loans/cron/reconcile
Authorization: Bearer <token>
Idempotency-Key: manual-recon-2026-09-22-uuid
Content-Type: application/json

{
  "loan_id": null,
  "target_date": "2026-09-22"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Financial reconciliation completed successfully",
  "data": {
    "report_id": 4,
    "report_uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reconciliation_date": "2026-09-22",
    "status": "clean",
    "total_loans_checked": 10,
    "total_periods_checked": 22,
    "discrepancy_count": 0,
    "summary": {
      "total_loans_checked": 10,
      "total_periods_checked": 22,
      "discrepancy_count": 0,
      "duration_ms": 110,
      "by_severity": { "CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0 }
    }
  }
}
```

### 5. Reconciliation Reports & Discrepancies
- `GET /api/interest-loans/cron/reconcile/reports`: Lists paginated reconciliation audit summaries.
- `GET /api/interest-loans/cron/reconcile/reports/:id/discrepancies`: Retrieves specific discrepancies for a given audit report.

---

## ⚙️ Environment Configuration (`.env`)

```ini
# Timezone (defaults to Asia/Kolkata +05:30)
TIMEZONE="Asia/Kolkata"

# Cron Schedules
INTEREST_LOAN_CRON_SCHEDULE="5 0 * * *"      # Daily interest accrual at 12:05 AM
INTEREST_LOAN_RECON_SCHEDULE="0 2 * * *"     # Daily financial reconciliation at 2:00 AM

# Batch & Performance Tuning
INTEREST_LOAN_BATCH_SIZE=50                  # Keyset pagination chunk size
INTEREST_LOAN_MAX_CATCHUP_PERIODS=100        # Maximum catch-up cycles before circuit breaker
INTEREST_LOAN_MAX_RETRIES=3                  # Max transaction retries on deadlock/timeout
INTEREST_LOAN_RETRY_BASE_DELAY=50            # Base retry delay in milliseconds (exponential backoff)
```

---

## 🧪 Testing & Verification

Run the test suites from the repository root:

```bash
# 1. Fixed-Point Math, Anchor Dates, Lock Contention, Reconciliation
node scratch/test_enterprise_cron.js

# 2. Multi-Period Catch-Up, Delta Update, and Audit Log Persistence
node scratch/test_catchup_and_audit.js

# 3. Production Readiness & Failure Injection Suite (Concurrency, Circuit Breaker, Idempotency)
node scratch/test_comprehensive_production_suite.js
```

---

## 🚨 Troubleshooting & Operations

| Symptom | Cause | Remediation |
| :--- | :--- | :--- |
| Job logs show `skipped: LOCKED_BY_ANOTHER_INSTANCE` | Another process or cluster node is currently executing the accrual job. | Normal cluster behavior. If process crashed, MySQL releases lock automatically when connection drops. |
| Job log status is `PARTIAL` | One or more loans failed during processing (e.g. invalid plan, foreign key issue). | Check `error_details` JSON column in `cron_job_logs`. Unaffected loans committed successfully. |
| `circuit_breaker_tripped = true` | Loan is more than 100 cycles behind (e.g. several years). | Inspect `financial_audit_logs` where `action = 'RECOVERY_REQUIRED'`. Run targeted catch-up via admin endpoint. |
| Reconciliation status: `discrepancies_found` | Period ledger sum does not match loan snapshot balance. | Query `/api/interest-loans/cron/reconcile/reports/:id/discrepancies` to view discrepancy type and expected values. |
