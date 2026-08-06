import { getDB } from "../../config/db.js";

const LOAN_PLANS_DATA = [
  {
    plan_name: "Daily Micro Business Plan",
    plan_code: "LP-DAILY-100",
    collection_frequency: "daily",
    tenure: 100,
    tenure_type: "days",
    commission_type: "percentage",
    commission_value: 2.0,
    description:
      "Daily repayment model designed for street vendors and small market traders.",
    status: "active",
    penalty: {
      grace_days: 1,
      penalty_type: "fixed",
      penalty_value: 50.0,
      max_penalty: 500.0,
    },
  },
  {
    plan_name: "Weekly Enterprise Flexi",
    plan_code: "LP-WEEKLY-12",
    collection_frequency: "weekly",
    tenure: 12,
    tenure_type: "weeks",
    commission_type: "fixed",
    commission_value: 250.0,
    description:
      "12-week loan plan tailored for small retail stores and inventory funding.",
    status: "active",
    penalty: {
      grace_days: 2,
      penalty_type: "percentage",
      penalty_value: 1.5, // 1.5% of overdue installment
      max_penalty: 1500.0,
    },
  },
  {
    plan_name: "Monthly Salary Advance Plan",
    plan_code: "LP-MONTHLY-06",
    collection_frequency: "monthly",
    tenure: 6,
    tenure_type: "months",
    commission_type: "percentage",
    commission_value: 1.5,
    description:
      "6-month personal installment plan for salaried professionals.",
    status: "active",
    penalty: {
      grace_days: 5,
      penalty_type: "fixed",
      penalty_value: 200.0,
      max_penalty: 2000.0,
    },
  },
  {
    plan_name: "Annual Business Growth Plan",
    plan_code: "LP-MONTHLY-12",
    collection_frequency: "monthly",
    tenure: 12,
    tenure_type: "months",
    commission_type: "percentage",
    commission_value: 3.0,
    description:
      "Standard 1-year commercial loan with structured monthly collection.",
    status: "active",
    penalty: {
      grace_days: 7,
      penalty_type: "percentage",
      penalty_value: 2.0,
      max_penalty: 5000.0,
    },
  },
  {
    plan_name: "Express Emergency Daily",
    plan_code: "LP-EXPRESS-30",
    collection_frequency: "daily",
    tenure: 30,
    tenure_type: "days",
    commission_type: "fixed",
    commission_value: 100.0,
    description: "Short-term emergency cash flow assistance.",
    status: "active",
    penalty: {
      grace_days: 0,
      penalty_type: "fixed",
      penalty_value: 100.0,
      max_penalty: 1000.0,
    },
  },
];

export const SeedLoanPlans = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log("  ⏳ Seeding Loan Plans and Penalties...");

    // Fetch a fallback user ID for created_by constraint
    const [users] = await connection.query("SELECT id FROM users LIMIT 1");
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    for (const plan of LOAN_PLANS_DATA) {
      await connection.beginTransaction();

      // 1. Insert or skip existing plan
      const [existing] = await connection.query(
        `SELECT id FROM loan_plans WHERE plan_code = ?`,
        [plan.plan_code],
      );

      let loanPlanId;

      if (existing.length === 0) {
        const [planResult] = await connection.query(
          `
          INSERT INTO loan_plans (
            plan_name, plan_code, collection_frequency, tenure, tenure_type,
            commission_type, commission_value, description, status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            plan.plan_name,
            plan.plan_code,
            plan.collection_frequency,
            plan.tenure,
            plan.tenure_type,
            plan.commission_type,
            plan.commission_value,
            plan.description,
            plan.status,
            createdByUserId,
          ],
        );
        loanPlanId = planResult.insertId;
      } else {
        loanPlanId = existing[0].id;
      }

      // 2. Insert or update penalty rules
      if (plan.penalty) {
        await connection.query(
          `
          INSERT INTO loan_plan_penalties (
            loan_plan_id, grace_days, penalty_type, penalty_value, max_penalty, status
          ) VALUES (?, ?, ?, ?, ?, 'active')
          ON DUPLICATE KEY UPDATE
            grace_days = VALUES(grace_days),
            penalty_type = VALUES(penalty_type),
            penalty_value = VALUES(penalty_value),
            max_penalty = VALUES(max_penalty)
          `,
          [
            loanPlanId,
            plan.penalty.grace_days,
            plan.penalty.penalty_type,
            plan.penalty.penalty_value,
            plan.penalty.max_penalty,
          ],
        );
      }

      await connection.commit();
    }

    console.log("  ✅ Loan Plans and Penalties seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Loan Plans:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
