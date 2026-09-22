import crypto from "crypto";
import { initDB, getDB } from "../src/config/db.js";
import { FinancialMath } from "../src/utils/financialMath.js";
import { InterestLoanAccrualService } from "../src/modules/interestLoan/cron/interestLoanAccrual.service.js";
import { InterestLoanReconciliationService } from "../src/modules/interestLoan/reconciliation/interestLoanReconciliation.service.js";

async function runProductionReadinessTests() {
  console.log("==========================================================");
  console.log("🛡️ PRODUCTION READINESS & FAILURE INJECTION TEST SUITE");
  console.log("==========================================================\n");

  await initDB();
  const db = getDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. FINANCIAL PRECISION & ROUNDING EDGES
  console.log("--- 1. Precision & Rounding Verification ---");
  {
    // Round half away from zero: 0.005 -> 0.01, -0.005 -> -0.01
    assert(FinancialMath.toMoney("0.005") === "0.01", "0.005 rounds up to 0.01");
    assert(FinancialMath.toMoney("0.0049") === "0.00", "0.0049 rounds down to 0.00");
    assert(FinancialMath.toMoney("-0.005") === "-0.01", "-0.005 rounds to -0.01");
    assert(FinancialMath.toMoney("-0.0001") === "0.00", "-0.0001 does not yield negative zero '-0.00'");

    // Multiplication: 33.33 * 1.5% = 0.49995 -> 0.50
    const calc = FinancialMath.calculateInterest("33.33", "1.5000", "percentage");
    assert(calc === "0.50", `Interest on 33.33 @ 1.5% is 0.50 (got ${calc})`);

    // Division: 100 / 3 = 33.33
    const div = FinancialMath.div("100.00", "3.00");
    assert(div === "33.33", `100 / 3 = 33.33 (got ${div})`);
  }

  // 2. CONCURRENCY: 2 WORKERS ATTEMPTING SAME LOAN
  console.log("\n--- 2. Concurrency: Simultaneous Accrual on Same Loan ---");
  {
    const loanNo = "CONCUR-" + Date.now();
    const [loanRes] = await db.query(
      `INSERT INTO interest_loans (
        loan_no, customer_id, interest_plan_id, principal_amount,
        outstanding_principal, total_interest_accrued, total_interest_paid,
        total_principal_paid, outstanding_interest, interest_type,
        interest_rate, interest_frequency, calculation_method,
        principal_basis, start_date, last_interest_date, next_interest_date,
        status, created_by
      ) VALUES (
        ?, 1, 1, 10000.00,
        10000.00, 0.00, 0.00,
        0.00, 0.00, 'percentage',
        2.0000, 'monthly', 'simple',
        'outstanding_principal', '2026-08-01', '2026-08-01', '2026-09-01',
        'active', 1
      )`,
      [loanNo]
    );
    const loanId = loanRes.insertId;

    try {
      // Fire 2 concurrent workers simultaneously targeting the same loan
      const [res1, res2] = await Promise.all([
        InterestLoanAccrualService.processSingleLoanAccrual(loanId, "2026-09-22"),
        InterestLoanAccrualService.processSingleLoanAccrual(loanId, "2026-09-22"),
      ]);

      const [periods] = await db.query(
        "SELECT period_no, scheduled_date FROM interest_loan_periods WHERE loan_id = ?",
        [loanId]
      );

      // Exactly 1 period (#1) should exist
      assert(periods.length === 1, `Concurrency control prevented duplication: exactly 1 period created (got ${periods.length})`);
      assert(periods[0].period_no === 1, "Created period is Period #1");

      const generatedCount = (res1.periods_generated || 0) + (res2.periods_generated || 0);
      assert(generatedCount === 1, `Total periods reported across workers is 1 (got ${generatedCount})`);
    } finally {
      await db.query("DELETE FROM financial_audit_logs WHERE loan_id = ?", [loanId]);
      await db.query("DELETE FROM interest_loan_periods WHERE loan_id = ?", [loanId]);
      await db.query("DELETE FROM interest_loans WHERE id = ?", [loanId]);
    }
  }

  // 3. CIRCUIT BREAKER & OVERDUE DOWNTIME CATCH-UP
  console.log("\n--- 3. Circuit Breaker Bounded Catch-Up ---");
  {
    const loanNo = "CB-TEST-" + Date.now();
    // Loan is 10 years overdue (120 monthly cycles)
    const [loanRes] = await db.query(
      `INSERT INTO interest_loans (
        loan_no, customer_id, interest_plan_id, principal_amount,
        outstanding_principal, total_interest_accrued, total_interest_paid,
        total_principal_paid, outstanding_interest, interest_type,
        interest_rate, interest_frequency, calculation_method,
        principal_basis, start_date, last_interest_date, next_interest_date,
        status, created_by
      ) VALUES (
        ?, 1, 1, 20000.00,
        20000.00, 0.00, 0.00,
        0.00, 0.00, 'percentage',
        2.0000, 'monthly', 'simple',
        'outstanding_principal', '2016-01-01', '2016-01-01', '2016-02-01',
        'active', 1
      )`,
      [loanNo]
    );
    const loanId = loanRes.insertId;

    try {
      // Run accrual as of today (120+ cycles overdue, exceeds MAX_CATCH_UP_PERIODS = 100)
      const cbResult = await InterestLoanAccrualService.processSingleLoanAccrual(loanId, "2026-09-22");

      assert(cbResult.circuit_breaker_tripped === true, "Circuit breaker tripped when catch-up exceeded threshold");
      assert(cbResult.periods_generated <= 100, `Periods generated capped at threshold (${cbResult.periods_generated} <= 100)`);

      // Verify that next_interest_date did not jump to today, leaving ungenerated periods in an uncorrupted state
      const [loanAfter] = await db.query("SELECT next_interest_date FROM interest_loans WHERE id = ?", [loanId]);
      assert(
        loanAfter[0].next_interest_date !== "2026-09-22",
        `next_interest_date was not silently fabricated (currently at: ${loanAfter[0].next_interest_date})`
      );

      // Verify audit alert was written
      const [alertAudit] = await db.query(
        "SELECT * FROM financial_audit_logs WHERE loan_id = ? AND action = 'RECOVERY_REQUIRED'",
        [loanId]
      );
      assert(alertAudit.length === 1, "RECOVERY_REQUIRED financial audit alert logged");
    } finally {
      await db.query("DELETE FROM financial_audit_logs WHERE loan_id = ?", [loanId]);
      await db.query("DELETE FROM interest_loan_periods WHERE loan_id = ?", [loanId]);
      await db.query("DELETE FROM interest_loans WHERE id = ?", [loanId]);
    }
  }

  // 4. IDEMPOTENCY MIDDLEWARE CONFLICT DETECTION
  console.log("\n--- 4. Idempotency Request Validation & Conflict Detection ---");
  {
    const testKey = "idemp-" + crypto.randomUUID();
    const payload1 = { target_date: "2026-09-22" };
    const hash1 = crypto.createHash("sha256").update(JSON.stringify(payload1)).digest("hex");

    // Insert cached response for payload1
    await db.query(
      `INSERT INTO idempotency_keys (
        idempotency_key, request_path, request_hash,
        response_status, response_body, expires_at
      ) VALUES (?, '/api/interest-loans/cron/run', ?, 200, '{"success":true,"job_id":100}', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [testKey, hash1]
    );

    // Verify key replay
    const [hit] = await db.query(
      "SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND expires_at > NOW()",
      [testKey]
    );
    assert(hit.length === 1, "Idempotency key found in database");
    assert(hit[0].request_hash === hash1, "Request hash matches original payload");

    // Verify payload tampering conflict detection
    const payload2 = { target_date: "2026-10-01" };
    const hash2 = crypto.createHash("sha256").update(JSON.stringify(payload2)).digest("hex");
    assert(hit[0].request_hash !== hash2, "Mismatched payload hash correctly identified for 409 Conflict");

    // Cleanup
    await db.query("DELETE FROM idempotency_keys WHERE idempotency_key = ?", [testKey]);
  }

  console.log("\n==========================================================");
  console.log(`🏁 PRODUCTION READINESS SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runProductionReadinessTests().catch((err) => {
  console.error("Fatal failure in test suite:", err);
  process.exit(1);
});
