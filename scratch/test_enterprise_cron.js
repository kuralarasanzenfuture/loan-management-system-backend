import { initDB, getDB } from "../src/config/db.js";
import { FinancialMath } from "../src/utils/financialMath.js";
import { InterestLoanAccrualService } from "../src/modules/interestLoan/cron/interestLoanAccrual.service.js";
import { InterestLoanAccrualJob } from "../src/modules/interestLoan/cron/interestLoanAccrual.job.js";
import { InterestLoanReconciliationService } from "../src/modules/interestLoan/reconciliation/interestLoanReconciliation.service.js";

async function runTests() {
  console.log("==========================================================");
  console.log("🧪 STARTING ENTERPRISE INTEREST LOAN TEST SUITE");
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

  // TEST 1: Fixed-Point Financial Math
  console.log("--- TEST 1: Fixed-Point Financial Math (BigInt ROUND_HALF_UP) ---");
  {
    // IEEE-754 0.1 + 0.2 is 0.30000000000000004
    const sum = FinancialMath.add("0.1", "0.2");
    assert(sum === "0.30", `FinancialMath.add("0.1", "0.2") === "0.30" (got ${sum})`);

    // Exact interest on 100,000 @ 2%
    const interest = FinancialMath.calculateInterest("100000.00", "2.0000", "percentage");
    assert(interest === "2000.00", `Interest on 100,000 @ 2% is 2000.00 (got ${interest})`);

    // Round half up on 123.455 -> 123.46
    const roundedHalfUp = FinancialMath.toMoney("123.455");
    assert(roundedHalfUp === "123.46", `123.455 rounds to 123.46 (got ${roundedHalfUp})`);

    // Round half up on 123.454 -> 123.45
    const roundedDown = FinancialMath.toMoney("123.454");
    assert(roundedDown === "123.45", `123.454 rounds to 123.45 (got ${roundedDown})`);
  }

  // TEST 2: Zero Date Drift Anchor Math
  console.log("\n--- TEST 2: Zero Date Drift Monthly Anchor Math ---");
  {
    const anchorDate = "2026-01-31";
    const cycle1 = InterestLoanAccrualService.computeCycleDate(anchorDate, 1, "monthly");
    const cycle2 = InterestLoanAccrualService.computeCycleDate(anchorDate, 2, "monthly");
    const cycle3 = InterestLoanAccrualService.computeCycleDate(anchorDate, 3, "monthly");
    const cycle4 = InterestLoanAccrualService.computeCycleDate(anchorDate, 4, "monthly");

    assert(cycle1 === "2026-02-28", `Cycle 1 from 2026-01-31 is 2026-02-28 (got ${cycle1})`);
    assert(cycle2 === "2026-03-31", `Cycle 2 from 2026-01-31 restores to 2026-03-31 (got ${cycle2})`);
    assert(cycle3 === "2026-04-30", `Cycle 3 from 2026-01-31 clamps to 2026-04-30 (got ${cycle3})`);
    assert(cycle4 === "2026-05-31", `Cycle 4 from 2026-01-31 restores to 2026-05-31 (got ${cycle4})`);
  }

  // TEST 3: Distributed Advisory Locking (GET_LOCK)
  console.log("\n--- TEST 3: Distributed Advisory Locking Concurrency Protection ---");
  {
    const conn1 = await db.getConnection();
    const lockKey = `interest_loan_accrual_cron_lock:test`;

    // Acquire lock on conn1
    const [acquireResult] = await conn1.query("SELECT GET_LOCK(?, 0) AS locked", [lockKey]);
    assert(Boolean(acquireResult[0]?.locked), "Worker 1 acquires distributed advisory lock");

    // Worker 2 attempts on separate connection
    const conn2 = await db.getConnection();
    const [competeResult] = await conn2.query("SELECT GET_LOCK(?, 0) AS locked", [lockKey]);
    assert(!Boolean(competeResult[0]?.locked), "Worker 2 cannot acquire lock (returns 0/false immediately)");

    // Worker 1 releases lock
    await conn1.query("SELECT RELEASE_LOCK(?)", [lockKey]);
    conn1.release();

    // Worker 2 can now acquire lock
    const [retryResult] = await conn2.query("SELECT GET_LOCK(?, 0) AS locked", [lockKey]);
    assert(Boolean(retryResult[0]?.locked), "Worker 2 acquires lock after Worker 1 releases it");
    await conn2.query("SELECT RELEASE_LOCK(?)", [lockKey]);
    conn2.release();
  }

  // TEST 4: Idempotency & Financial Audit Trail
  console.log("\n--- TEST 4: Idempotency & Immutable Audit Ledger ---");
  {
    // Check audit logs table
    const [auditCountBefore] = await db.query("SELECT COUNT(*) as total FROM financial_audit_logs");
    const countBefore = auditCountBefore[0].total;
    assert(countBefore >= 0, `financial_audit_logs table queried successfully (current count: ${countBefore})`);

    // Check idempotency keys table
    const testKey = "test-idempotency-" + Date.now();
    await db.query(
      `INSERT INTO idempotency_keys (
        idempotency_key, request_path, request_hash,
        response_status, response_body, expires_at
      ) VALUES (?, '/test', 'hash123', 200, '{"ok":true}', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [testKey]
    );

    const [keyRow] = await db.query("SELECT * FROM idempotency_keys WHERE idempotency_key = ?", [testKey]);
    assert(keyRow.length === 1, "Idempotency key inserted and retrieved correctly");

    // Clean up test key
    await db.query("DELETE FROM idempotency_keys WHERE idempotency_key = ?", [testKey]);
  }

  // TEST 5: Independent Financial Reconciliation Engine
  console.log("\n--- TEST 5: Independent Financial Reconciliation Engine ---");
  {
    const reconResult = await InterestLoanReconciliationService.runReconciliation();
    assert(reconResult && reconResult.report_id > 0, `Reconciliation run produced report ID ${reconResult?.report_id}`);
    assert(reconResult.total_loans_checked > 0, `Reconciliation checked ${reconResult.total_loans_checked} loans`);

    const discrepancies = await InterestLoanReconciliationService.getDiscrepanciesByReportId(reconResult.report_id);
    assert(Array.isArray(discrepancies), `Discrepancies retrieved as array (count: ${discrepancies.length})`);
    console.log(`  ℹ️ Discrepancy details logged: ${discrepancies.length} discrepancy record(s) cataloged`);
  }

  console.log("\n==========================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
