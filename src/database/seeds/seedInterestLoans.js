import { getDB } from "../../config/db.js";

/**
 * Seed Customer Anytime Interest Loans, Periods, Payments, and Payment Allocations
 * Complete, mathematically consistent realtime dataset covering:
 * - interest_loans (027)
 * - interest_loan_periods (028)
 * - interest_loan_payments (029)
 * - interest_loan_payment_allocations (030)
 */
export const SeedInterestLoansTable = async () => {
  const db = getDB();
  const conn = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding Realtime Customer Interest Loans, Periods, Payments & Allocations...",
    );

    // 1. Fetch active customers
    const [customers] = await conn.query(
      "SELECT id, customer_no, first_name, last_name FROM customers WHERE status = 'active' ORDER BY id ASC",
    );
    if (customers.length === 0) {
      console.warn(" ⚠️ No active customers found. Skipping interest loans seed.");
      return;
    }

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

    // 3. Fetch system users for audit fields
    const [users] = await conn.query("SELECT id FROM users ORDER BY id ASC");
    const defaultUserId = users.length > 0 ? users[0].id : 1;
    const staffUserId = users.length > 1 ? users[1].id : defaultUserId;

    // 4. Complete realtime dataset (10 Loans) with exact periods, payments, and allocations
    const REALTIME_LOANS = [
      // 1. Suresh - Monthly 2% - Disbursed Sep 12, next due Oct 12, zero payments yet
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
        payments: [],
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
        payments: [],
      },

      // 3. Murugan - Weekly 1% - Period 1 paid (₹500), Period 2 overdue (₹500), Period 3 pending (₹500)
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
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-09-12 11:30:00",
            payment_amount: 500.0,
            interest_amount: 500.0,
            principal_amount: 0.0,
            outstanding_interest_before: 500.0,
            outstanding_principal_before: 50000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 50000.0,
            payment_mode: "upi",
            transaction_reference: "UPI/6256192841/MURUGAN",
            cheque_number: null,
            remarks: "Period 1 weekly interest payment received via UPI",
            received_by: staffUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 500.0,
              },
            ],
          },
        ],
      },

      // 4. Meena - Monthly 2% - Principal ₹75k reduced to ₹60k (₹15k paid), Period 1 interest paid
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
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-09-15 14:20:00",
            payment_amount: 16500.0,
            interest_amount: 1500.0,
            principal_amount: 15000.0,
            outstanding_interest_before: 1500.0,
            outstanding_principal_before: 75000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 60000.0,
            payment_mode: "bank",
            transaction_reference: "IMPS/6258129034/MEENA",
            cheque_number: null,
            remarks: "Period 1 interest (₹1,500) + ₹15,000 part-payment of principal",
            received_by: defaultUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 1500.0,
              },
              {
                allocation_type: "principal",
                period_no: null,
                amount: 15000.0,
              },
            ],
          },
        ],
      },

      // 5. Priya - Monthly 2% - ₹1,50,000, interest ₹4,000 due (₹2,000 partial paid)
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
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-08-05 10:15:00",
            payment_amount: 2000.0,
            interest_amount: 2000.0,
            principal_amount: 0.0,
            outstanding_interest_before: 3000.0,
            outstanding_principal_before: 150000.0,
            outstanding_interest_after: 1000.0,
            outstanding_principal_after: 150000.0,
            payment_mode: "cash",
            transaction_reference: null,
            cheque_number: null,
            remarks: "Partial interest collection for July month (₹2,000 of ₹3,000)",
            received_by: defaultUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 2000.0,
              },
            ],
          },
        ],
      },

      // 6. Rajendran - Daily 1% - ₹25,000, Day 1 paid (₹250), Day 2 due today (₹250)
      {
        loan_no: "INTL-000006",
        customer_name: "Rajendran",
        customer_fallback_idx: 5,
        plan_code: "INT-DAILY-1",
        principal_amount: 25000.0,
        outstanding_principal: 25000.0,
        total_interest_accrued: 500.0,
        total_interest_paid: 250.0,
        total_principal_paid: 0.0,
        outstanding_interest: 250.0,
        start_date: "2026-09-20",
        last_interest_date: "2026-09-21",
        next_interest_date: "2026-09-22",
        last_payment_date: "2026-09-21 17:30:00",
        status: "active",
        remarks: "Daily turnaround interest credit for wholesale trading inventory.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-09-20",
            period_end_date: "2026-09-21",
            scheduled_date: "2026-09-21",
            actual_collection_date: "2026-09-21",
            opening_principal: 25000.0,
            interest_rate: 1.0,
            interest_amount: 250.0,
            paid_interest_amount: 250.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-09-21",
            period_end_date: "2026-09-22",
            scheduled_date: "2026-09-22",
            actual_collection_date: null,
            opening_principal: 25000.0,
            interest_rate: 1.0,
            interest_amount: 250.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 250.0,
            status: "due",
          },
        ],
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-09-21 17:30:00",
            payment_amount: 250.0,
            interest_amount: 250.0,
            principal_amount: 0.0,
            outstanding_interest_before: 250.0,
            outstanding_principal_before: 25000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 25000.0,
            payment_mode: "cash",
            transaction_reference: null,
            cheque_number: null,
            remarks: "Day 1 daily interest payment collected in cash",
            received_by: staffUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 250.0,
              },
            ],
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
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-08-31 16:45:00",
            payment_amount: 22000.0,
            interest_amount: 2000.0,
            principal_amount: 20000.0,
            outstanding_interest_before: 2000.0,
            outstanding_principal_before: 100000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 80000.0,
            payment_mode: "bank",
            transaction_reference: "NEFT/883492015/SURESH",
            cheque_number: null,
            remarks: "Period 1 interest ₹2,000 + ₹20,000 principal reduction",
            received_by: defaultUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 2000.0,
              },
              {
                allocation_type: "principal",
                period_no: null,
                amount: 20000.0,
              },
            ],
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
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-06-10 10:30:00",
            payment_amount: 1000.0,
            interest_amount: 1000.0,
            principal_amount: 0.0,
            outstanding_interest_before: 1000.0,
            outstanding_principal_before: 50000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 50000.0,
            payment_mode: "cash",
            transaction_reference: null,
            cheque_number: null,
            remarks: "Month 1 interest payment collected in cash",
            received_by: defaultUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 1000.0,
              },
            ],
          },
          {
            payment_no: 2,
            payment_date: "2026-07-10 12:00:00",
            payment_amount: 51000.0,
            interest_amount: 1000.0,
            principal_amount: 50000.0,
            outstanding_interest_before: 1000.0,
            outstanding_principal_before: 50000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 0.0,
            payment_mode: "bank",
            transaction_reference: "RTGS/202607100984/MURUGAN",
            cheque_number: null,
            remarks: "Month 2 interest (₹1,000) + full principal settlement (₹50,000). Loan closed.",
            received_by: defaultUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 2,
                amount: 1000.0,
              },
              {
                allocation_type: "principal",
                period_no: null,
                amount: 50000.0,
              },
            ],
          },
        ],
      },

      // 9. Aarav - Daily 0.1% Simple - ₹1,00,000, Day 1 interest paid via UPI, Day 2 pending
      {
        loan_no: "INTL-000009",
        customer_name: "Aarav",
        customer_fallback_idx: 6,
        plan_code: "INT-DAILY-0.1",
        principal_amount: 100000.0,
        outstanding_principal: 100000.0,
        total_interest_accrued: 200.0,
        total_interest_paid: 100.0,
        total_principal_paid: 0.0,
        outstanding_interest: 0.0,
        start_date: "2026-09-21",
        last_interest_date: "2026-09-22",
        next_interest_date: "2026-09-23",
        last_payment_date: "2026-09-22 09:30:00",
        status: "active",
        remarks: "Rapid-turnaround commercial daily credit with 0.1% daily rate.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-09-21",
            period_end_date: "2026-09-22",
            scheduled_date: "2026-09-22",
            actual_collection_date: "2026-09-22",
            opening_principal: 100000.0,
            interest_rate: 0.1,
            interest_amount: 100.0,
            paid_interest_amount: 100.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-09-22",
            period_end_date: "2026-09-23",
            scheduled_date: "2026-09-23",
            actual_collection_date: null,
            opening_principal: 100000.0,
            interest_rate: 0.1,
            interest_amount: 100.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 100.0,
            status: "pending",
          },
        ],
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-09-22 09:30:00",
            payment_amount: 100.0,
            interest_amount: 100.0,
            principal_amount: 0.0,
            outstanding_interest_before: 100.0,
            outstanding_principal_before: 100000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 100000.0,
            payment_mode: "upi",
            transaction_reference: "UPI/7732910482/AARAV",
            cheque_number: null,
            remarks: "Day 1 interest payment received via UPI",
            received_by: staffUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 100.0,
              },
            ],
          },
        ],
      },

      // 10. Diya - Monthly Fixed ₹1000 - ₹25,000, Month 1 paid in cash, Month 2 pending
      {
        loan_no: "INTL-000010",
        customer_name: "Diya",
        customer_fallback_idx: 7,
        plan_code: "INT-MONTHLY-FIXED-1000",
        principal_amount: 25000.0,
        outstanding_principal: 25000.0,
        total_interest_accrued: 2000.0,
        total_interest_paid: 1000.0,
        total_principal_paid: 0.0,
        outstanding_interest: 0.0,
        start_date: "2026-08-20",
        last_interest_date: "2026-09-20",
        next_interest_date: "2026-10-20",
        last_payment_date: "2026-09-20 15:00:00",
        status: "active",
        remarks: "Fixed ₹1,000 monthly flat interest charge on original principal.",
        periods: [
          {
            period_no: 1,
            period_start_date: "2026-08-20",
            period_end_date: "2026-09-20",
            scheduled_date: "2026-09-20",
            actual_collection_date: "2026-09-20",
            opening_principal: 25000.0,
            interest_rate: 0.0,
            interest_amount: 1000.0,
            paid_interest_amount: 1000.0,
            outstanding_interest_amount: 0.0,
            status: "paid",
          },
          {
            period_no: 2,
            period_start_date: "2026-09-20",
            period_end_date: "2026-10-20",
            scheduled_date: "2026-10-20",
            actual_collection_date: null,
            opening_principal: 25000.0,
            interest_rate: 0.0,
            interest_amount: 1000.0,
            paid_interest_amount: 0.0,
            outstanding_interest_amount: 1000.0,
            status: "pending",
          },
        ],
        payments: [
          {
            payment_no: 1,
            payment_date: "2026-09-20 15:00:00",
            payment_amount: 1000.0,
            interest_amount: 1000.0,
            principal_amount: 0.0,
            outstanding_interest_before: 1000.0,
            outstanding_principal_before: 25000.0,
            outstanding_interest_after: 0.0,
            outstanding_principal_after: 25000.0,
            payment_mode: "cash",
            transaction_reference: null,
            cheque_number: null,
            remarks: "Month 1 fixed interest collected in cash",
            received_by: staffUserId,
            allocations: [
              {
                allocation_type: "interest",
                period_no: 1,
                amount: 1000.0,
              },
            ],
          },
        ],
      },
    ];

    // 5. Atomic transaction to seed all 4 tables cleanly
    await conn.beginTransaction();

    // Safely clear previous seed records for REALTIME_LOANS (preserving user-created loans)
    const seededLoanNos = REALTIME_LOANS.map((l) => l.loan_no);
    const [existingSeeded] = await conn.query(
      "SELECT id FROM interest_loans WHERE loan_no IN (?)",
      [seededLoanNos],
    );

    if (existingSeeded.length > 0) {
      const existingIds = existingSeeded.map((r) => r.id);
      await conn.query(
        `DELETE a FROM interest_loan_payment_allocations a
         INNER JOIN interest_loan_payments p ON a.payment_id = p.id
         WHERE p.loan_id IN (?)`,
        [existingIds],
      );
      await conn.query(
        "DELETE FROM interest_loan_payments WHERE loan_id IN (?)",
        [existingIds],
      );
      await conn.query(
        "DELETE FROM interest_loan_periods WHERE loan_id IN (?)",
        [existingIds],
      );
      await conn.query(
        "DELETE FROM interest_loans WHERE id IN (?)",
        [existingIds],
      );
    }

    let totalLoansSeeded = 0;
    let totalPeriodsSeeded = 0;
    let totalPaymentsSeeded = 0;
    let totalAllocationsSeeded = 0;

    for (const loanData of REALTIME_LOANS) {
      const customer = findCustomer(
        loanData.customer_name,
        loanData.customer_fallback_idx,
      );
      const plan = getPlan(loanData.plan_code);

      // A. Insert Loan
      const [loanResult] = await conn.query(
        `INSERT INTO interest_loans (
          loan_no, customer_id, interest_plan_id, principal_amount, outstanding_principal,
          total_interest_accrued, total_interest_paid, total_principal_paid, outstanding_interest,
          interest_type, interest_rate, interest_frequency, calculation_method, principal_basis,
          start_date, last_interest_date, next_interest_date, last_payment_date, status, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          defaultUserId,
        ],
      );

      const loanId = loanResult.insertId;
      totalLoansSeeded++;

      // B. Insert Periods and keep map of period_no -> periodId
      const periodIdMap = new Map();

      for (const p of loanData.periods) {
        const [periodResult] = await conn.query(
          `INSERT INTO interest_loan_periods (
            loan_id, period_no, period_start_date, period_end_date, scheduled_date,
            actual_collection_date, opening_principal, interest_rate, interest_amount,
            paid_interest_amount, outstanding_interest_amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

        periodIdMap.set(p.period_no, periodResult.insertId);
        totalPeriodsSeeded++;
      }

      // C. Insert Payments and Allocations
      for (const pay of loanData.payments) {
        const [paymentResult] = await conn.query(
          `INSERT INTO interest_loan_payments (
            loan_id, payment_no, payment_date, payment_amount, interest_amount,
            principal_amount, outstanding_interest_before, outstanding_principal_before,
            outstanding_interest_after, outstanding_principal_after, payment_mode,
            transaction_reference, cheque_number, remarks, received_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loanId,
            pay.payment_no,
            pay.payment_date,
            pay.payment_amount,
            pay.interest_amount,
            pay.principal_amount,
            pay.outstanding_interest_before,
            pay.outstanding_principal_before,
            pay.outstanding_interest_after,
            pay.outstanding_principal_after,
            pay.payment_mode,
            pay.transaction_reference,
            pay.cheque_number,
            pay.remarks,
            pay.received_by,
          ],
        );

        const paymentId = paymentResult.insertId;
        totalPaymentsSeeded++;

        // D. Insert Payment Allocations
        for (const alloc of pay.allocations) {
          const interestPeriodId =
            alloc.period_no !== null
              ? periodIdMap.get(alloc.period_no) || null
              : null;

          await conn.query(
            `INSERT INTO interest_loan_payment_allocations (
              payment_id, interest_period_id, allocation_type, amount
            ) VALUES (?, ?, ?, ?)`,
            [paymentId, interestPeriodId, alloc.allocation_type, alloc.amount],
          );

          totalAllocationsSeeded++;
        }
      }
    }

    await conn.commit();

    console.log(
      ` ✅ Successfully seeded all 4 Interest Loan tables: ${totalLoansSeeded} Loans, ${totalPeriodsSeeded} Periods, ${totalPaymentsSeeded} Payments, and ${totalAllocationsSeeded} Payment Allocations!`,
    );
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error seeding interest loans domain tables:", err.message);
    throw err;
  } finally {
    conn.release();
  }
};

export default SeedInterestLoansTable;
