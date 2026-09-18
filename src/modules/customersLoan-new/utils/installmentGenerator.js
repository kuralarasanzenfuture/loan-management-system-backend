import LoanInstallmentModel from "../../loanInstallments/installment.model.js";

/**
 * Parses date string (YYYY-MM-DD) into UTC Date to prevent timezone drift
 * @param {string|Date} dateVal 
 * @returns {Date}
 */
export function parseUTCDate(dateVal) {
  if (dateVal instanceof Date) {
    return new Date(
      Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate()),
    );
  }

  const parts = String(dateVal).split("T")[0].split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  return new Date(Date.UTC(year, month, day));
}

/**
 * Formats Date to YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
export function formatUTCDate(date) {
  return date.toISOString().split("T")[0];
}

/**
 * Generates due dates for all installments with optional Sunday skipping
 * @param {Object} params
 * @param {string|Date} params.startDate
 * @param {string} params.collectionFrequency - "daily" | "weekly" | "monthly"
 * @param {number} params.tenure
 * @param {boolean} [params.skipSunday=false]
 * @returns {string[]} Array of YYYY-MM-DD due dates
 */
export function calculateInstallmentDates({
  startDate,
  collectionFrequency,
  tenure,
  skipSunday = false,
}) {
  const count = Number(tenure);

  if (!Number.isInteger(count) || count <= 0) {
    throw {
      status: 400,
      message: "Invalid loan plan tenure",
    };
  }

  if (!startDate) {
    throw {
      status: 400,
      message: "Loan start date is required",
    };
  }

  const frequency = String(collectionFrequency).toLowerCase();
  if (!["daily", "weekly", "monthly"].includes(frequency)) {
    throw {
      status: 400,
      message: "Invalid collection frequency",
    };
  }

  const dates = [];

  if (frequency === "daily") {
    const current = parseUTCDate(startDate);

    // If start_date is Sunday and skipSunday is active, start from Monday
    if (skipSunday && current.getUTCDay() === 0) {
      current.setUTCDate(current.getUTCDate() + 1);
    }

    for (let i = 0; i < count; i++) {
      if (i > 0) {
        current.setUTCDate(current.getUTCDate() + 1);
        if (skipSunday && current.getUTCDay() === 0) {
          // Skip Sunday -> move to Monday
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
      dates.push(formatUTCDate(current));
    }
  } else if (frequency === "weekly") {
    const baseDate = parseUTCDate(startDate);

    // If start_date is Sunday and skipSunday is active, adjust base to Monday
    if (skipSunday && baseDate.getUTCDay() === 0) {
      baseDate.setUTCDate(baseDate.getUTCDate() + 1);
    }

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setUTCDate(dueDate.getUTCDate() + i * 7);

      if (skipSunday && dueDate.getUTCDay() === 0) {
        dueDate.setUTCDate(dueDate.getUTCDate() + 1);
      }

      dates.push(formatUTCDate(dueDate));
    }
  } else if (frequency === "monthly") {
    const baseDate = parseUTCDate(startDate);

    if (skipSunday && baseDate.getUTCDay() === 0) {
      baseDate.setUTCDate(baseDate.getUTCDate() + 1);
    }

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + i);

      if (skipSunday && dueDate.getUTCDay() === 0) {
        dueDate.setUTCDate(dueDate.getUTCDate() + 1);
      }

      dates.push(formatUTCDate(dueDate));
    }
  }

  return dates;
}

/**
 * Calculates loan end date based on plan tenure and skip_sunday setting
 * @param {Object} params
 * @param {string|Date} params.startDate
 * @param {Object} params.plan
 * @returns {string} YYYY-MM-DD
 */
export function calculateLoanEndDate({ startDate, plan }) {
  const skipSunday = Boolean(plan.skip_sunday);

  if (skipSunday) {
    const dates = calculateInstallmentDates({
      startDate,
      collectionFrequency: plan.collection_frequency,
      tenure: plan.tenure,
      skipSunday: true,
    });
    return dates[dates.length - 1];
  }

  const endDate = new Date(startDate);
  switch (plan.tenure_type) {
    case "days":
      endDate.setDate(endDate.getDate() + Number(plan.tenure));
      break;

    case "weeks":
      endDate.setDate(endDate.getDate() + Number(plan.tenure) * 7);
      break;

    case "months":
      endDate.setMonth(endDate.getMonth() + Number(plan.tenure));
      break;

    default:
      throw {
        status: 400,
        message: "Invalid tenure type",
      };
  }

  return endDate.toISOString().split("T")[0];
}

/**
 * Generates an array of installment records for a loan
 * @param {Object} params
 * @param {Object} params.loan
 * @param {Object} params.plan
 * @returns {Array<Object>}
 */
export function generateInstallmentsForLoan({ loan, plan }) {
  const tenure = Number(plan.tenure);

  if (!Number.isInteger(tenure) || tenure <= 0) {
    throw {
      status: 400,
      message: "Invalid loan plan tenure",
    };
  }

  const totalRepayment = Number(loan.total_repayment);

  if (!Number.isFinite(totalRepayment) || totalRepayment <= 0) {
    throw {
      status: 400,
      message: "Invalid total repayment",
    };
  }

  if (!loan.start_date) {
    throw {
      status: 400,
      message: "Loan start date is required",
    };
  }

  const dates = calculateInstallmentDates({
    startDate: loan.start_date,
    collectionFrequency: plan.collection_frequency,
    tenure,
    skipSunday: Boolean(plan.skip_sunday),
  });

  const normalAmount = Number((totalRepayment / tenure).toFixed(2));
  let remaining = totalRepayment;

  const installments = [];

  for (let i = 1; i <= tenure; i++) {
    const due_date = dates[i - 1];

    let principal_amount;
    if (i === tenure) {
      principal_amount = Number(remaining.toFixed(2));
    } else {
      principal_amount = normalAmount;
    }

    remaining = Number((remaining - principal_amount).toFixed(2));

    installments.push({
      loan_id: loan.id,
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

/**
 * Generates and saves installments for a loan in the database
 * @param {Object} conn - MySQL connection
 * @param {Object} loan - Loan entity
 * @param {Object} plan - Loan plan entity
 * @returns {Promise<Array<Object>>}
 */
export async function generateAndSaveInstallments(conn, loan, plan) {
  const installments = generateInstallmentsForLoan({ loan, plan });
  await LoanInstallmentModel.createMany(conn, installments);
  return installments;
}
