import { getDB } from "../../config/db.js";

// Helper to format Date object into YYYY-MM-DD
const formatDate = (date) => date.toISOString().split("T")[0];

// Sequential loan number generator
async function generateLoanNo(conn) {
  const year = new Date().getFullYear();

  const [rows] = await conn.query(
    `
    SELECT loan_no 
    FROM loans
    WHERE loan_no LIKE ?
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
    `,
    [`LN-${year}-%`],
  );

  let nextNumber = 1;

  if (rows.length > 0 && rows[0].loan_no) {
    const lastNo = rows[0].loan_no;
    const parts = lastNo.split("-");
    if (parts.length === 3) {
      nextNumber = parseInt(parts[2], 10) + 1;
    }
  }

  const formatted = String(nextNumber).padStart(6, "0");
  return `LN-${year}-${formatted}`;
}

// Generate installments based on your exact logic
function generateInstallmentSchedules(loanId, totalRepayment, startDate, plan) {
  const tenure = Number(plan.tenure);
  const installmentCount = tenure;
  const normalAmount = Number((totalRepayment / installmentCount).toFixed(2));

  let remaining = totalRepayment;
  const installments = [];

  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date(startDate);

    switch (plan.collection_frequency) {
      case "daily":
        dueDate.setDate(dueDate.getDate() + (i - 1));
        break;
      case "weekly":
        dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
        break;
      case "monthly":
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        break;
    }

    const due_date = formatDate(dueDate);
    let principal_amount;

    if (i === installmentCount) {
      principal_amount = Number(remaining.toFixed(2));
    } else {
      principal_amount = normalAmount;
    }

    remaining = Number((remaining - principal_amount).toFixed(2));

    installments.push({
      loan_id: loanId,
      installment_no: i,
      due_date,
      principal_amount,
      penalty_amount: 0,
      total_due: principal_amount,
      paid_amount: 0,
      balance_amount: principal_amount,
      paid_date: null,
      status: "pending",
    });
  }

  return installments;
}

export const SeedLoans = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log("  ⏳ Seeding Loans and Loan Installments...");

    // Fetch prerequisite records
    const [customers] = await connection.query(
      "SELECT id FROM customers LIMIT 20",
    );
    const [plans] = await connection.query(
      "SELECT * FROM loan_plans WHERE status = 'active'",
    );
    const [users] = await connection.query("SELECT id FROM users LIMIT 1");

    if (customers.length === 0 || plans.length === 0) {
      console.log(
        "  ⚠️ Skipping Loans seed: Ensure Customers and Loan Plans are seeded first.",
      );
      return;
    }

    const userId = users.length > 0 ? users[0].id : 1;
    const loanAmounts = [10000, 20000, 25000, 50000, 100000];

    // Seed loans for 15 customers
    const totalLoansToSeed = Math.min(15, customers.length);

    for (let i = 0; i < totalLoansToSeed; i++) {
      await connection.beginTransaction();

      const customer = customers[i];
      const plan = plans[i % plans.length]; // Cycle through active plans
      const loanAmount = loanAmounts[i % loanAmounts.length];

      // 1. Calculate Commission Amount based on plan configuration
      let commissionAmount = 0;
      const commVal = Number(plan.commission_value) || 0;

      if (plan.commission_type === "percentage") {
        commissionAmount = Number(((loanAmount * commVal) / 100).toFixed(2));
      } else {
        commissionAmount = Number(commVal.toFixed(2));
      }

      const netDisbursedAmount = Number(
        (loanAmount - commissionAmount).toFixed(2),
      );

      // Calculate total repayment (Principal + 10% interest for realistic mock data)
      const totalRepayment = Number((loanAmount * 1.1).toFixed(2));
      const installmentAmount = Number(
        (totalRepayment / plan.tenure).toFixed(2),
      );

      // 2. Set Start and End dates based on tenure and frequency
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - i * 2); // Stagger start dates slightly

      const endDateObj = new Date(startDateObj);
      if (plan.collection_frequency === "daily") {
        endDateObj.setDate(endDateObj.getDate() + plan.tenure);
      } else if (plan.collection_frequency === "weekly") {
        endDateObj.setDate(endDateObj.getDate() + plan.tenure * 7);
      } else if (plan.collection_frequency === "monthly") {
        endDateObj.setMonth(endDateObj.getMonth() + plan.tenure);
      }

      const startDate = formatDate(startDateObj);
      const endDate = formatDate(endDateObj);
      const loanNo = await generateLoanNo(connection);

      // 3. Insert Loan
      const [loanResult] = await connection.query(
        `
        INSERT INTO loans (
          loan_no, customer_id, loan_plan_id, loan_amount, commission_amount,
          net_disbursed_amount, installment_amount, total_repayment,
          start_date, end_date, created_by, updated_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `,
        [
          loanNo,
          customer.id,
          plan.id,
          loanAmount,
          commissionAmount,
          netDisbursedAmount,
          installmentAmount,
          totalRepayment,
          startDate,
          endDate,
          userId,
          userId,
        ],
      );

      const insertedLoanId = loanResult.insertId;

      // 4. Generate & Insert Loan Installments
      const installments = generateInstallmentSchedules(
        insertedLoanId,
        totalRepayment,
        startDate,
        plan,
      );

      const installmentValues = installments.map((inst) => [
        inst.loan_id,
        inst.installment_no,
        inst.due_date,
        inst.principal_amount,
        inst.penalty_amount,
        inst.total_due,
        inst.paid_amount,
        inst.balance_amount,
        inst.paid_date,
        inst.status,
      ]);

      await connection.query(
        `
        INSERT INTO loan_installments (
          loan_id, installment_no, due_date, principal_amount,
          penalty_amount, total_due, paid_amount, balance_amount,
          paid_date, status
        ) VALUES ?
        `,
        [installmentValues],
      );

      await connection.commit();
    }

    console.log(
      `  ✅ Successfully seeded ${totalLoansToSeed} Loans and their Installment schedules!`,
    );
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Loans:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
