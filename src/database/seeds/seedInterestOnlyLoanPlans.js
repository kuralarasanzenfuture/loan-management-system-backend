import { getDB } from "../../config/db.js";

const INTEREST_ONLY_LOAN_PLANS = [
  {
    plan_name: "Monthly Interest Bullet 12-Month Plan",
    plan_code: "IOL-M12-P2",
    interest_type: "percentage",
    interest_value: 2.0, // 2% per month (Matches your example: ₹50,000 -> ₹1,000/mo)
    interest_frequency: "monthly",
    tenure: 12,
    tenure_type: "months",
    principal_repayment: "end_of_term",
    penalty_enabled: true,
    commission_type: "percentage",
    commission_value: 1.0, // 1% processing/agent commission fee
    description:
      "Standard 12-month loan plan where interest is paid monthly (e.g. 2% = ₹1,000 on ₹50,000) and full principal is collected at month 12 end.",
    status: "active",
  },
  {
    plan_name: "Short-Term Hand Loan 6-Month Interest-Only",
    plan_code: "IOL-M06-P1.5",
    interest_type: "percentage",
    interest_value: 1.5, // 1.5% per month
    interest_frequency: "monthly",
    tenure: 6,
    tenure_type: "months",
    principal_repayment: "end_of_term",
    penalty_enabled: true,
    commission_type: "none",
    commission_value: 0.0,
    description:
      "Flexible short-term loan requiring monthly interest payments for 6 months, principal repaid in lump sum upon maturity.",
    status: "active",
  },
  {
    plan_name: "Quarterly Commercial Interest Plan (2-Year)",
    plan_code: "IOL-Q24-P5",
    interest_type: "percentage",
    interest_value: 5.0, // 5% charged per quarter
    interest_frequency: "quarterly",
    tenure: 2,
    tenure_type: "years",
    principal_repayment: "end_of_term",
    penalty_enabled: true,
    commission_type: "fixed",
    commission_value: 2500.0,
    description:
      "Designed for business expansion. Interest billed every 3 months with total principal due at the end of 2 years.",
    status: "active",
  },
  {
    plan_name: "Micro Fixed Interest Express Plan (3-Month)",
    plan_code: "IOL-M03-FIXED",
    interest_type: "fixed",
    interest_value: 1500.0, // Fixed ₹1,500 monthly interest charge
    interest_frequency: "monthly",
    tenure: 3,
    tenure_type: "months",
    principal_repayment: "end_of_term",
    penalty_enabled: false,
    commission_type: "fixed",
    commission_value: 500.0,
    description:
      "Fixed monthly interest billing plan designed for rapid micro-advances over a 3-month cycle.",
    status: "active",
  },
  {
    plan_name: "Annual Corporate Working Capital 1-Year Plan",
    plan_code: "IOL-Y01-P12",
    interest_type: "percentage",
    interest_value: 12.0, // 12% single annual interest payout
    interest_frequency: "yearly",
    tenure: 1,
    tenure_type: "years",
    principal_repayment: "end_of_term",
    penalty_enabled: true,
    commission_type: "percentage",
    commission_value: 2.0,
    description:
      "Single-year corporate facility where total annual interest is paid upfront or at year-end with bullet principal recovery.",
    status: "active",
  },
  {
    plan_name: "High-Yield Semi-Annual Investment Plan (3-Year)",
    plan_code: "IOL-HY36-P8",
    interest_type: "percentage",
    interest_value: 8.0, // 8% every 6 months
    interest_frequency: "half_yearly",
    tenure: 3,
    tenure_type: "years",
    principal_repayment: "end_of_term",
    penalty_enabled: true,
    commission_type: "percentage",
    commission_value: 1.5,
    description:
      "Longer-term commercial loan plan with half-yearly interest collection and final principal bullet repayment after 36 months.",
    status: "inactive",
  },
];

export const SeedInterestOnlyLoanPlansTable = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding Interest-Only Loan Plans into 'interest_only_loan_plans' table...",
    );

    // 1. Fetch valid user ID for foreign key constraint (created_by)
    const [users] = await connection.query(
      "SELECT id FROM users ORDER BY id ASC LIMIT 1",
    );
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    let insertedCount = 0;

    for (const plan of INTEREST_ONLY_LOAN_PLANS) {
      await connection.beginTransaction();

      await connection.query(
        `
        INSERT INTO interest_only_loan_plans (
          plan_name, plan_code, interest_type, interest_value, interest_frequency,
          tenure, tenure_type, principal_repayment, penalty_enabled,
          commission_type, commission_value, description, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          plan_name = VALUES(plan_name),
          interest_type = VALUES(interest_type),
          interest_value = VALUES(interest_value),
          interest_frequency = VALUES(interest_frequency),
          tenure = VALUES(tenure),
          tenure_type = VALUES(tenure_type),
          principal_repayment = VALUES(principal_repayment),
          penalty_enabled = VALUES(penalty_enabled),
          commission_type = VALUES(commission_type),
          commission_value = VALUES(commission_value),
          description = VALUES(description),
          status = VALUES(status),
          updated_by = VALUES(created_by),
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          plan.plan_name,
          plan.plan_code,
          plan.interest_type,
          plan.interest_value,
          plan.interest_frequency,
          plan.tenure,
          plan.tenure_type,
          plan.principal_repayment,
          plan.penalty_enabled,
          plan.commission_type,
          plan.commission_value,
          plan.description,
          plan.status,
          createdByUserId,
        ],
      );

      await connection.commit();
      insertedCount++;
    }

    console.log(
      ` ✅ Successfully seeded ${insertedCount} Interest-Only Loan Plans!`,
    );
  } catch (error) {
    await connection.rollback();
    console.error(
      "❌ Error seeding interest_only_loan_plans table:",
      error.message,
    );
    throw error;
  } finally {
    connection.release();
  }
};
