import { getDB } from "../../config/db.js";

/**
 * Seed Customer Anytime Interest Loans and Collection Periods
 * Exact implementation of 027_interest_loans and 028_interest_loan_periods reference specifications.
 */
export const SeedInterestLoansTable = async () => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding Realtime Customer Interest Loans & Periods (027 & 028)...",
    );

    // 1. Fetch active customers
    const [customers] = await conn.query(
      "SELECT id, customer_no, first_name, last_name FROM customers WHERE status = 'active' ORDER BY id ASC",
    );
    if (customers.length === 0) {
      console.warn(" ⚠️ No active customers found. Skipping interest loans seed.");
      return;
    }

    // Map customers by first name if present, else fallback sequentially
    const findCustomer = (name, fallbackIdx) => {
      const match = customers.find(
        (c) => c.first_name?.toLowerCase() === name.toLowerCase(),
      );
      return match || customers[fallbackIdx % customers.length];
    };

    // 2. Fetch active interest loan plans
    const [plans] = await conn.query(
      "SELECT id, plan_name, plan_code, interest_type, interest_value, interest_frequency, calculation_method, principal_basis FROM interest_loan_plans WHERE status = 'active' ORDER BY id ASC",
    );
    if (plans.length === 0) {
      console.warn(" ⚠️ No active interest loan plans found. Skipping interest loans seed.");
      return;
    }

    const getPlan = (code) => {
      return plans.find((p) => p.plan_code === code) || plans[0];
    };

    // 3. Complete realtime dataset matching 027_interest_loans and 028_interest_loan_periods
    const REALTIME_LOANS = [
      // 1. Suresh - Monthly 2% - Just started Sep 12, next Oct 12, no dues yet
      {
        loan_no: "INTL-000001",
        customer_name: "Suresh",
        customer_fallback_idx: 0,
        plan_code: "INT-MONTHLY-2",
        principal_amount: 100000.0,
        outstanding_principal: 100000.0,
        total_interest_accrued: 0.0,
        total_interest_paid: 0.0,
        total_principal_paid: 0.0,
        outstanding_interest: 0.0,
        start_date: "2026-09-12",
        last_interest_date: null,
        next_interest_date: "2026-10-12",
        last_payment_date: null,
        status: "active",
        remarks: "First anytime interest loan disbursed on reducing balance.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-09-12",
            period_end_date: "2026-10-12",
            scheduled_date: "2026-10-12",
            actual_collection_date: null,
            opening_principal: 100000.0,
            interest_rate: 2.0,
            interest_amount: 2000.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 2000.0,
            status: "pending",
          },
        ],
      },

      // 2. Kavitha - Monthly 3% - Started Aug 31, interest due Sep 30
      {
        loan_no: "INTL-000002",
        customer_name: "Kavitha",
        customer_fallback_idx: 1,
        plan_code: "INT-MONTHLY-3",
        principal_amount: 200000.0,
        outstanding_principal: 200000.0,
        total_interest_accrued: 6000.0,
        total_interest_paid: 0.0,
        total_principal_paid: 0.0,
        outstanding_interest: 6000.0,
        start_date: "2026-08-31",
        last_interest_date: null,
        next_interest_date: "2026-09-30",
        last_payment_date: null,
        status: "active",
        remarks: "High-value commercial anytime loan with 3% monthly rate.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-08-31",
            period_end_date: "2026-09-30",
            scheduled_date: "2026-09-30",
            actual_collection_date: null,
            opening_principal: 200000.0,
            interest_rate: 3.0,
            interest_amount: 6000.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 6000.0,
            status: "due",
          },
        ],
      },

      // 3. Murugan - Weekly 1% - Period 1 paid, Period 2 due (₹500), Period 3 pending (₹500) -> ₹1,000 due
      {
        loan_no: "INTL-000003",
        customer_name: "Murugan",
        customer_fallback_idx: 2,
        plan_code: "INT-WEEKLY-1",
        principal_amount: 50000.0,
        outstanding_principal: 50000.0,
        total_interest_accrued: 1500.0,
        total_interest_paid: 500.0,
        total_principal_paid: 0.0,
        outstanding_interest: 1000.0,
        start_date: "2026-09-05",
        last_interest_date: "2026-09-12",
        next_interest_date: "2026-09-26",
        last_payment_date: "2026-09-12 11:30:00",
        status: "active",
        remarks: "Weekly market merchant credit with regular interest collections.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-09-05",
            period_end_date: "2026-09-12",
            scheduled_date: "2026-09-12",
            actual_collection_date: "2026-09-12",
            opening_principal: 50000.0,
            interest_rate: 1.0,
            interest_amount: 500.0,
            paid_interest_amount: 500.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-09-12",
            period_end_date: "2026-09-19",
            scheduled_date: "2026-09-19",
            actual_collection_date: null,
            opening_principal: 50000.0,
            interest_rate: 1.0,
            interest_amount: 500.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 500.0,
            status: "due",
          },
          {
            period_no: 3,
            period_start_date: "2026-09-19",
            period_end_date: "2026-09-26",
            scheduled_date: "2026-09-26",
            actual_collection_date: null,
            opening_principal: 50000.0,
            interest_rate: 1.0,
            interest_amount: 500.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 500.0,
            status: "pending",
          },
        ],
      },

      // 4. Meena - Monthly 2% - Principal ₹75k reduced to ₹60k (₹15k paid), interest up to date
      {
        loan_no: "INTL-000004",
        customer_name: "Meena",
        customer_fallback_idx: 3,
        plan_code: "INT-MONTHLY-2",
        principal_amount: 75000.0,
        outstanding_principal: 60000.0,
        total_interest_accrued: 1500.0,
        total_interest_paid: 1500.0,
        total_principal_paid: 15000.0,
        outstanding_interest: 0.0,
        start_date: "2026-08-15",
        last_interest_date: "2026-09-15",
        next_interest_date: "2026-10-15",
        last_payment_date: "2026-09-15 14:20:00",
        status: "active",
        remarks: "Customer paid ₹15,000 towards principal reducing monthly interest liability.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-08-15",
            period_end_date: "2026-09-15",
            scheduled_date: "2026-09-15",
            actual_collection_date: "2026-09-15",
            opening_principal: 75000.0,
            interest_rate: 2.0,
            interest_amount: 1500.0,
            paid_interest_amount: 1500.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-09-15",
            period_end_date: "2026-10-15",
            scheduled_date: "2026-10-15",
            actual_collection_date: null,
            opening_principal: 60000.0,
            interest_rate: 2.0,
            interest_amount: 1200.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 1200.0,
            status: "pending",
          },
        ],
      },

      // 5. Priya - Monthly 2% - ₹1,50,000, interest ₹4,000 due
      {
        loan_no: "INTL-000005",
        customer_name: "Priya",
        customer_fallback_idx: 4,
        plan_code: "INT-MONTHLY-2",
        principal_amount: 150000.0,
        outstanding_principal: 150000.0,
        total_interest_accrued: 6000.0,
        total_interest_paid: 2000.0,
        total_principal_paid: 0.0,
        outstanding_interest: 4000.0,
        start_date: "2026-07-01",
        last_interest_date: "2026-08-01",
        next_interest_date: "2026-10-01",
        last_payment_date: "2026-08-05 10:15:00",
        status: "active",
        remarks: "Partial interest payment received; ₹4,000 interest outstanding.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-07-01",
            period_end_date: "2026-08-01",
            scheduled_date: "2026-08-01",
            actual_collection_date: "2026-08-05",
            opening_principal: 150000.0,
            interest_rate: 2.0,
            interest_amount: 3000.0,
            paid_interest_amount: 2000.0,
            outstanding_interest_amount: 1000.0,
            status: "partial",
          },
          {
            period_no: 2,
            period_start_date: "2026-08-01",
            period_end_date: "2026-09-01",
            scheduled_date: "2026-09-01",
            actual_collection_date: null,
            opening_principal: 150000.0,
            interest_rate: 2.0,
            interest_amount: 3000.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 3000.0,
            status: "due",
          },
          {
            period_no: 3,
            period_start_date: "2026-09-01",
            period_end_date: "2026-10-01",
            scheduled_date: "2026-10-01",
            actual_collection_date: null,
            opening_principal: 150000.0,
            interest_rate: 2.0,
            interest_amount: 3000.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 3000.0,
            status: "pending",
          },
        ],
      },

      // 6. Rajendran - Daily 1% - ₹25,000, Start Sep 20, Next Sep 21
      {
        loan_no: "INTL-000006",
        customer_name: "Rajendran",
        customer_fallback_idx: 5,
        plan_code: "INT-DAILY-1",
        principal_amount: 25000.0,
        outstanding_principal: 25000.0,
        total_interest_accrued: 250.0,
        total_interest_paid: 0.0,
        total_principal_paid: 0.0,
        outstanding_interest: 0.0,
        start_date: "2026-09-20",
        last_interest_date: null,
        next_interest_date: "2026-09-21",
        last_payment_date: null,
        status: "active",
        remarks: "Daily turnaround interest credit for wholesale trading inventory.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-09-20",
            period_end_date: "2026-09-21",
            scheduled_date: "2026-09-21",
            actual_collection_date: null,
            opening_principal: 25000.0,
            interest_rate: 1.0,
            interest_amount: 250.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 250.0,
            status: "due",
          },
        ],
      },

      // 7. Suresh - Monthly 2% - ₹1,00,000 reduced to ₹80,000 (₹20k paid), interest up to date
      {
        loan_no: "INTL-000007",
        customer_name: "Suresh",
        customer_fallback_idx: 0,
        plan_code: "INT-MONTHLY-2",
        principal_amount: 100000.0,
        outstanding_principal: 80000.0,
        total_interest_accrued: 2000.0,
        total_interest_paid: 2000.0,
        total_principal_paid: 20000.0,
        outstanding_interest: 0.0,
        start_date: "2026-07-31",
        last_interest_date: "2026-08-31",
        next_interest_date: "2026-09-30",
        last_payment_date: "2026-08-31 16:45:00",
        status: "active",
        remarks: "Second anytime loan of customer with ₹20,000 principal prepaid.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-07-31",
            period_end_date: "2026-08-31",
            scheduled_date: "2026-08-31",
            actual_collection_date: "2026-08-31",
            opening_principal: 100000.0,
            interest_rate: 2.0,
            interest_amount: 2000.0,
            paid_interest_amount: 2000.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-08-31",
            period_end_date: "2026-09-30",
            scheduled_date: "2026-09-30",
            actual_collection_date: null,
            opening_principal: 80000.0,
            interest_rate: 2.0,
            interest_amount: 1600.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 1600.0,
            status: "pending",
          },
        ],
      },

      // 8. Murugan - Monthly 2% - ₹50,000 fully paid, Completed, next_interest_date NULL
      {
        loan_no: "INTL-000008",
        customer_name: "Murugan",
        customer_fallback_idx: 2,
        plan_code: "INT-MONTHLY-2",
        principal_amount: 50000.0,
        outstanding_principal: 0.0,
        total_interest_accrued: 2000.0,
        total_interest_paid: 2000.0,
        total_principal_paid: 50000.0,
        outstanding_interest: 0.0,
        start_date: "2026-05-10",
        last_interest_date: "2026-07-10",
        next_interest_date: null,
        last_payment_date: "2026-07-10 12:00:00",
        status: "completed",
        remarks: "Loan fully settled and completed on July 10.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-05-10",
            period_end_date: "2026-06-10",
            scheduled_date: "2026-06-10",
            actual_collection_date: "2026-06-10",
            opening_principal: 50000.0,
            interest_rate: 2.0,
            interest_amount: 1000.0,
            paid_interest_amount: 1000.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-06-10",
            period_end_date: "2026-07-10",
            scheduled_date: "2026-07-10",
            actual_collection_date: "2026-07-10",
            opening_principal: 50000.0,
            interest_rate: 2.0,
            interest_amount: 1000.0,
            paid_interest_amount: 1000.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
        ],
      },
    ];

    let totalLoansSeeded = 0;
    let totalPeriodsSeeded = 0;

    for (const loanData of REALTIME_LOANS) {
      await conn.beginTransaction();

      const customer = findCustomer(
        loanData.customer_name,
        loanData.customer_fallback_idx,
      );
      const plan = getPlan(loanData.plan_code);

      // 1. Upsert loan
      await conn.query(
        `INSERT INTO interest_loans (
          loan_no, customer_id, interest_plan_id, principal_amount, outstanding_principal,
          total_interest_accrued, total_interest_paid, total_principal_paid, outstanding_interest,
          interest_type, interest_rate, interest_frequency, calculation_method, principal_basis,
          start_date, last_interest_date, next_interest_date, last_payment_date, status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          customer_id = VALUES(customer_id),
          interest_plan_id = VALUES(interest_plan_id),
          principal_amount = VALUES(principal_amount),
          outstanding_principal = VALUES(outstanding_principal),
          total_interest_accrued = VALUES(total_interest_accrued),
          total_interest_paid = VALUES(total_interest_paid),
          total_principal_paid = VALUES(total_principal_paid),
          outstanding_interest = VALUES(outstanding_interest),
          interest_type = VALUES(interest_type),
          interest_rate = VALUES(interest_rate),
          interest_frequency = VALUES(interest_frequency),
          calculation_method = VALUES(calculation_method),
          principal_basis = VALUES(principal_basis),
          start_date = VALUES(start_date),
          last_interest_date = VALUES(last_interest_date),
          next_interest_date = VALUES(next_interest_date),
          last_payment_date = VALUES(last_payment_date),
          status = VALUES(status),
          remarks = VALUES(remarks)`,
        [
          loanData.loan_no,
          customer.id,
          plan.id,
          loanData.principal_amount,
          loanData.outstanding_principal,
          loanData.total_interest_accrued,
          loanData.total_interest_paid,
          loanData.total_principal_paid,
          loanData.outstanding_interest,
          plan.interest_type,
          plan.interest_value,
          plan.interest_frequency,
          plan.calculation_method,
          plan.principal_basis,
          loanData.start_date,
          loanData.last_interest_date,
          loanData.next_interest_date,
          loanData.last_payment_date,
          loanData.status,
          loanData.remarks,
        ],
      );

      // Get loan ID
      const [loanRows] = await conn.query(
        "SELECT id FROM interest_loans WHERE loan_no = ?",
        [loanData.loan_no],
      );
      const loanId = loanRows[0].id;
      totalLoansSeeded++;

      // 2. Upsert periods for this loan
      for (const p of loanData.periods) {
        await conn.query(
          `INSERT INTO interest_loan_periods (
            loan_id, period_no, period_start_date, period_end_date, scheduled_date,
            actual_collection_date, opening_principal, interest_rate, interest_amount,
            paid_interest_amount, outstanding_interest_amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            period_start_date = VALUES(period_start_date),
            period_end_date = VALUES(period_end_date),
            scheduled_date = VALUES(scheduled_date),
            actual_collection_date = VALUES(actual_collection_date),
            opening_principal = VALUES(opening_principal),
            interest_rate = VALUES(interest_rate),
            interest_amount = VALUES(interest_amount),
            paid_interest_amount = VALUES(paid_interest_amount),
            outstanding_interest_amount = VALUES(outstanding_interest_amount),
            status = VALUES(status)`,
          [
            loanId,
            p.period_no,
            p.period_start_date,
            p.period_end_date,
            p.scheduled_date,
            p.actual_collection_date,
            p.opening_principal,
            p.interest_rate,
            p.interest_amount,
            p.paid_interest_amount,
            p.outstanding_interest_amount,
            p.status,
          ],
        );
        totalPeriodsSeeded++;
      }

      await conn.commit();
    }

    console.log(
      ` ✅ Successfully seeded ${totalLoansSeeded} Customer Interest Loans and ${totalPeriodsSeeded} Periods!`,
    );
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error seeding interest loans and periods:", err.message);
    throw err;
  } finally {
    conn.release();
  }
};

export default SeedInterestLoansTable;
