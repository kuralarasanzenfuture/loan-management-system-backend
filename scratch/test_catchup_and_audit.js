import { initDB, getDB } from "../src/config/db.js";
import { InterestLoanAccrualService } from "../src/modules/interestLoan/cron/interestLoanAccrual.service.js";

async function testCatchUpAndAudit() {
  await initDB();
  const db = getDB();

  console.log("--- Testing Single Loan Multi-Period Catch-up & Financial Audit Logs ---");

  // 1. Create a temporary test loan that is 3 months behind
  const testLoanNo = "TEST-INTL-" + Date.now();
  const [insertLoan] = await db.query(
    `INSERT INTO interest_loans (
      loan_no, customer_id, interest_plan_id, principal_amount,
      outstanding_principal, total_interest_accrued, total_interest_paid,
      total_principal_paid, outstanding_interest, interest_type,
      interest_rate, interest_frequency, calculation_method,
      principal_basis, start_date, last_interest_date, next_interest_date,
      status, created_by
    ) VALUES (
      ?, 1, 1, 50000.00,
      50000.00, 0.00, 0.00,
      0.00, 0.00, 'percentage',
      2.0000, 'monthly', 'simple',
      'outstanding_principal', '2026-06-01', '2026-06-01', '2026-07-01',
      'active', 1
    )`,
    [testLoanNo]
  );
  const testLoanId = insertLoan.insertId;
  console.log(`Created test loan ID: ${testLoanId} (${testLoanNo})`);

  try {
    // 2. Process accrual as of 2026-09-22 (should catch up 3 periods: July 1, Aug 1, Sept 1)
    const result = await InterestLoanAccrualService.processSingleLoanAccrual(
      testLoanId,
      "2026-09-22",
      { jobId: 9999 }
    );
    console.log("Accrual Result:", result);

    // 3. Verify periods generated
    const [periods] = await db.query(
      "SELECT period_no, period_start_date, period_end_date, scheduled_date, interest_amount, status FROM interest_loan_periods WHERE loan_id = ? ORDER BY period_no ASC",
      [testLoanId]
    );
    console.log(`Generated ${periods.length} period(s):`);
    periods.forEach((p) => {
      console.log(`  Period #${p.period_no}: ${p.scheduled_date} | Amount: ${p.interest_amount} | Status: ${p.status}`);
    });

    if (periods.length === 3) {
      console.log("✅ PASS: Correctly generated 3 catch-up periods!");
    } else {
      console.error(`❌ FAIL: Expected 3 periods, got ${periods.length}`);
    }

    // 4. Verify loan master totals
    const [updatedLoan] = await db.query(
      "SELECT total_interest_accrued, outstanding_interest, next_interest_date FROM interest_loans WHERE id = ?",
      [testLoanId]
    );
    console.log("Updated Loan Master:", updatedLoan[0]);
    if (
      updatedLoan[0].total_interest_accrued === "3000.00" &&
      updatedLoan[0].outstanding_interest === "3000.00" &&
      updatedLoan[0].next_interest_date === "2026-10-01"
    ) {
      console.log("✅ PASS: Loan master updated accurately (total: 3000.00, next: 2026-10-01)!");
    } else {
      console.error("❌ FAIL: Loan master values unexpected:", updatedLoan[0]);
    }

    // 5. Verify immutable financial audit logs
    const [auditLogs] = await db.query(
      "SELECT action, actor_type, job_id, before_state, after_state FROM financial_audit_logs WHERE loan_id = ?",
      [testLoanId]
    );
    console.log(`Recorded ${auditLogs.length} financial audit log(s):`);
    auditLogs.forEach((l) => {
      const after = typeof l.after_state === "string" ? JSON.parse(l.after_state) : l.after_state;
      console.log(`  Action: ${l.action} | Actor: ${l.actor_type} | Interest Added: ${after.interest_amount} | After Balance: ${after.outstanding_interest}`);
    });

    if (auditLogs.length === 3) {
      console.log("✅ PASS: All 3 period generations wrote immutable audit trail entries!");
    } else {
      console.error(`❌ FAIL: Expected 3 audit logs, got ${auditLogs.length}`);
    }

    // 6. Test Idempotency: Re-running accrual for same date should generate 0 periods
    const rerunResult = await InterestLoanAccrualService.processSingleLoanAccrual(
      testLoanId,
      "2026-09-22",
      { jobId: 9999 }
    );
    console.log("Rerun Result (Idempotency Check):", rerunResult);
    const rerunPeriods = rerunResult.periods_generated || 0;
    if (rerunPeriods === 0 && rerunResult.skipped) {
      console.log("✅ PASS: Re-running is strictly idempotent (skipped: true, 0 periods created)!");
    } else {
      console.error("❌ FAIL: Re-run should have skipped or created 0 periods");
    }
  } finally {
    // Clean up test loan records
    await db.query("DELETE FROM financial_audit_logs WHERE loan_id = ?", [testLoanId]);
    await db.query("DELETE FROM interest_loan_periods WHERE loan_id = ?", [testLoanId]);
    await db.query("DELETE FROM interest_loans WHERE id = ?", [testLoanId]);
    console.log("Cleaned up test data.");
  }

  process.exit(0);
}

testCatchUpAndAudit().catch((e) => {
  console.error("Error in testCatchUpAndAudit:", e);
  process.exit(1);
});
