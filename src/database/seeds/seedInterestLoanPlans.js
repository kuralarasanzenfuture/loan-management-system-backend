import { getDB } from "../../config/db.js";

const INTEREST_LOAN_PLANS = [
  {
    plan_name: "Monthly 2% Simple",
    plan_code: "INT-MONTHLY-2",
    interest_type: "percentage",
    interest_value: 2.0000,
    interest_frequency: "monthly",
    calculation_method: "simple",
    principal_basis: "outstanding_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Standard 2% monthly interest plan calculated on outstanding principal with flexible anytime payments",
  },
  {
    plan_name: "Monthly 3% Simple",
    plan_code: "INT-MONTHLY-3",
    interest_type: "percentage",
    interest_value: 3.0000,
    interest_frequency: "monthly",
    calculation_method: "simple",
    principal_basis: "outstanding_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Standard 3% monthly interest plan calculated on outstanding principal with flexible anytime payments",
  },
  {
    plan_name: "Weekly 1% Simple",
    plan_code: "INT-WEEKLY-1",
    interest_type: "percentage",
    interest_value: 1.0000,
    interest_frequency: "weekly",
    calculation_method: "simple",
    principal_basis: "outstanding_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Short-term 1% weekly interest plan on outstanding balance with flexible anytime payments",
  },
  {
    plan_name: "Daily 1% Simple",
    plan_code: "INT-DAILY-1",
    interest_type: "percentage",
    interest_value: 1.0000,
    interest_frequency: "daily",
    calculation_method: "simple",
    principal_basis: "outstanding_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Daily rate of 1% on outstanding balance for daily collection credit",
  },
  {
    plan_name: "Daily 0.1% Simple",
    plan_code: "INT-DAILY-0.1",
    interest_type: "percentage",
    interest_value: 0.1000,
    interest_frequency: "daily",
    calculation_method: "simple",
    principal_basis: "outstanding_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Daily rate of 0.1% on outstanding balance for rapid-turnaround commercial credit",
  },
  {
    plan_name: "Monthly Fixed ₹1000",
    plan_code: "INT-MONTHLY-FIXED-1000",
    interest_type: "fixed",
    interest_value: 1000.0000,
    interest_frequency: "monthly",
    calculation_method: "simple",
    principal_basis: "original_principal",
    payment_type: "anytime",
    status: "active",
    description:
      "Fixed ₹1,000 monthly interest flat charge on original principal with anytime payments",
  },
];

export const SeedInterestLoanPlansTable = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding Anytime Interest Loan Plans into 'interest_loan_plans' table...",
    );

    // 1. Fetch valid user ID for foreign key constraint (created_by)
    const [users] = await connection.query(
      "SELECT id FROM users ORDER BY id ASC LIMIT 1",
    );
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    let insertedCount = 0;

    for (const plan of INTEREST_LOAN_PLANS) {
      await connection.beginTransaction();

      await connection.query(
        `
        INSERT INTO interest_loan_plans (
          plan_name, plan_code, interest_type, interest_value, interest_frequency,
          calculation_method, principal_basis, payment_type, status, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          plan_name = VALUES(plan_name),
          interest_type = VALUES(interest_type),
          interest_value = VALUES(interest_value),
          interest_frequency = VALUES(interest_frequency),
          calculation_method = VALUES(calculation_method),
          principal_basis = VALUES(principal_basis),
          payment_type = VALUES(payment_type),
          status = VALUES(status),
          description = VALUES(description),
          updated_by = VALUES(created_by),
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          plan.plan_name,
          plan.plan_code,
          plan.interest_type,
          plan.interest_value,
          plan.interest_frequency,
          plan.calculation_method,
          plan.principal_basis,
          plan.payment_type,
          plan.status,
          plan.description,
          createdByUserId,
        ],
      );

      await connection.commit();
      insertedCount++;
    }

    console.log(
      ` ✅ Successfully seeded ${insertedCount} Interest Loan Plans!`,
    );
  } catch (error) {
    await connection.rollback();
    console.error(
      "❌ Error seeding interest_loan_plans table:",
      error.message,
    );
    throw error;
  } finally {
    connection.release();
  }
};

export default SeedInterestLoanPlansTable;
