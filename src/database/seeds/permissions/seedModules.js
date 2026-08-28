import { getDB } from "../../../config/db.js";

// Professional configuration array mapping frontend NAV_SECTIONS to Database Modules
const NAV_SECTIONS = [
  {
    label: "Dashboard",
    code: "SEC_DASHBOARD",
    items: [
      {
        label: "Dashboard",
        code: "MOD_DASHBOARD",
        path: "/dashboard",
        description: "Main application dashboard overview",
      },
      {
        label: "Analytics",
        code: "MOD_ANALYTICS",
        path: "/analytics",
        description: "Business analytics and metrics",
      },
    ],
  },
  {
    label: "Customer Management",
    code: "SEC_CUSTOMER_MGMT",
    items: [
      {
        label: "Customers",
        code: "MOD_CUSTOMERS",
        path: "/customers",
        description: "Customer profile and account management",
      },
      {
        label: "Customer Documents",
        code: "MOD_CUSTOMER_DOCS",
        path: "/customer-documents",
        description: "Document repository for customer verification",
      },
      {
        label: "Guarantors",
        code: "MOD_GUARANTORS",
        path: "/guarantors",
        description: "Guarantor records for loan applications",
      },
    ],
  },
  {
    label: "Loan Management",
    code: "SEC_LOAN_MGMT",
    items: [
      {
        label: "Loan Applications",
        code: "MOD_LOAN_APPS",
        path: "/loan-applications",
        description: "Manage loan applications and approvals",
      },
      {
        label: "Loan Approval",
        code: "MOD_LOAN_APPROVAL",
        path: "/loan-approval",
        description: "Loan approval workflows",
      },
      {
        label: "Active Loans",
        code: "MOD_ACTIVE_LOANS",
        path: "/active-loans",
        description: "Disbursed active loan accounts tracking",
      },
      {
        label: "Loan Plans",
        code: "MOD_LOAN_PLANS",
        path: "/loan-plans",
        description: "Loan tenure and repayment scheme definitions",
      },
      {
        label: "Loan Types",
        code: "MOD_LOAN_TYPES",
        path: "/loan-types",
        description: "Category classification for loans",
      },
      {
        label: "Interest Rates",
        code: "MOD_INTEREST_RATES",
        path: "/interest-rates",
        description: "Interest slab rules and rate schedules",
      },
      {
        label: "Penalty Rules",
        code: "MOD_PENALTY_RULES",
        path: "/penalty-rules",
        description: "Overdue penalty fee rules",
      },
      {
        label: "Loan Closure",
        code: "MOD_LOAN_CLOSURE",
        path: "/loan-closure",
        description: "NOC generation and loan account closure",
      },
    ],
  },
  {
    label: "Collections",
    code: "SEC_COLLECTIONS",
    items: [
      {
        label: "Loan Collections",
        code: "MOD_LOAN_COLLECTIONS",
        path: "/loan-collections",
        description: "General collection management",
      },
      {
        label: "EMI Collection",
        code: "MOD_EMI_COLLECTION",
        path: "/emi-collection",
        description: "Daily/Monthly installment collection entry",
      },
      {
        label: "Receipts",
        code: "MOD_RECEIPTS",
        path: "/receipts",
        description: "Payment receipt register",
      },
      {
        label: "Due Collections",
        code: "MOD_DUE_COLLECTIONS",
        path: "/due-collections",
        description: "Upcoming and overdue EMI collection tracking",
      },
      {
        label: "Penalty Collection",
        code: "MOD_PENALTY_COLLECTION",
        path: "/penalty-collection",
        description: "Late fee collection ledger",
      },
    ],
  },
  {
    label: "Finance",
    code: "SEC_FINANCE",
    items: [
      {
        label: "Income",
        code: "MOD_INCOME",
        path: "/income",
        description: "Income revenue ledger",
      },
      {
        label: "Expenses",
        code: "MOD_EXPENSES",
        path: "/expenses",
        description: "Operational expense entries",
      },
      {
        label: "Cash Book",
        code: "MOD_CASH_BOOK",
        path: "/cash-book",
        description: "Daily office cash inflow and outflow tracking",
      },
      {
        label: "Transactions",
        code: "MOD_TRANSACTIONS",
        path: "/transactions",
        description: "General financial transaction audit",
      },
    ],
  },
  {
    label: "Hand Loans",
    code: "SEC_HAND_LOANS",
    items: [
      {
        label: "Hand Loans",
        code: "MOD_HAND_LOANS",
        path: "/hand-loans",
        description: "Short-term non-collateral hand loan management",
      },
    ],
  },
  {
    label: "Personal Chits",
    code: "SEC_PERSONAL_CHITS",
    items: [
      {
        label: "Personal Chits",
        code: "MOD_PERSONAL_CHITS",
        path: "/personal-chits",
        description: "Internal chit fund and savings group records",
      },
    ],
  },
  {
    label: "Organization",
    code: "SEC_ORGANIZATION",
    items: [
      {
        label: "Branches",
        code: "MOD_BRANCHES",
        path: "/branches",
        description: "Branch offices and location setup",
      },
      {
        label: "Companies",
        code: "MOD_COMPANIES",
        path: "/companies-details",
        description: "Company profile & registered entity settings",
      },
      {
        label: "Bank Accounts",
        code: "MOD_BANK_ACCOUNTS",
        path: "/bank-accounts",
        description: "Company banking details and account ledger",
      },
      {
        label: "Bank Transactions",
        code: "MOD_BANK_TRANSACTIONS",
        path: "/bank-transactions",
        description: "Bank passbook statement log",
      },
      {
        label: "Assets Categories",
        code: "MOD_ASSET_CATEGORIES",
        path: "/asset-categories",
        description: "Classification of business assets",
      },
      {
        label: "Assets",
        code: "MOD_ASSETS",
        path: "/assets",
        description: "Company fixed asset register",
      },
    ],
  },
  {
    label: "Administration",
    code: "SEC_ADMINISTRATION",
    items: [
      {
        label: "Users",
        code: "MOD_USERS",
        path: "/users",
        description: "System user accounts & access control",
      },
      {
        label: "Roles",
        code: "MOD_ROLES",
        path: "/roles",
        description: "Security role definitions",
      },
      {
        label: "Role Permissions",
        code: "MOD_ROLE_PERMISSIONS",
        path: "/role-permissions",
        description: "Granular permission assignment per role",
      },
      {
        label: "Audit Logs",
        code: "MOD_AUDIT_LOGS",
        path: "/audit-logs",
        description: "System operations and data modification trail",
      },
    ],
  },
  {
    label: "Communication",
    code: "SEC_COMMUNICATION",
    items: [
      {
        label: "SMS",
        code: "MOD_SMS",
        path: "/sms",
        description: "SMS gateway logs and template management",
      },
      {
        label: "Email",
        code: "MOD_EMAIL",
        path: "/email",
        description: "Email service integration and delivery logs",
      },
      {
        label: "Notifications",
        code: "MOD_NOTIFICATIONS",
        path: "/notifications",
        description: "System and push notification center",
      },
    ],
  },
  {
    label: "Reports",
    code: "SEC_REPORTS",
    items: [
      {
        label: "Loan Reports",
        code: "MOD_REP_LOANS",
        path: "/loan-reports",
        description: "Loan portfolio reporting",
      },
      {
        label: "Loan Installment Reports",
        code: "MOD_REP_INSTALLMENTS",
        path: "/installment-reports",
        description: "EMI recovery schedule reports",
      },
      {
        label: "Collection Reports",
        code: "MOD_REP_COLLECTIONS",
        path: "/reports/loan-collections",
        description: "Collection efficiency analysis",
      },
      {
        label: "Customer Reports",
        code: "MOD_REP_CUSTOMERS",
        path: "/customer-reports",
        description: "Customer demographics and credit history report",
      },
      {
        label: "Financial Reports",
        code: "MOD_REP_FINANCIAL",
        path: "/reports/finance",
        description: "Profit & Loss, balance overview reports",
      },
    ],
  },
  {
    label: "System",
    code: "SEC_SYSTEM",
    items: [
      {
        label: "Settings",
        code: "MOD_SETTINGS",
        path: "/settings",
        description: "Global application configuration settings",
      },
      {
        label: "Database Backup",
        code: "MOD_DB_BACKUP",
        path: "/database-backup",
        description: "Automated & manual database backup tools",
      },
      {
        label: "Activity Logs",
        code: "MOD_ACTIVITY_LOGS",
        path: "/activity-logs",
        description: "User activity and session logging",
      },
    ],
  },
];

export const SeedModulesTable = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding hierarchical Navigation Modules into 'modules' table...",
    );

    let parentSortOrder = 1;

    for (const section of NAV_SECTIONS) {
      await connection.beginTransaction();

      // 1. Upsert Parent Section Module
      const [parentResult] = await connection.query(
        `
        INSERT INTO modules (name, code, description, parent_id, sort_order, is_active)
        VALUES (?, ?, ?, NULL, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          sort_order = VALUES(sort_order),
          is_active = TRUE
        `,
        [
          section.label,
          section.code,
          `Nav Section: ${section.label}`,
          parentSortOrder,
        ],
      );

      // Get Parent ID (If inserted new record or updated existing)
      let parentId;
      if (parentResult.insertId && parentResult.insertId > 0) {
        parentId = parentResult.insertId;
      } else {
        const [rows] = await connection.query(
          "SELECT id FROM modules WHERE code = ?",
          [section.code],
        );
        parentId = rows[0].id;
      }

      // 2. Upsert Child Items under the Parent Module
      let childSortOrder = 1;
      for (const item of section.items) {
        await connection.query(
          `
          INSERT INTO modules (name, code, description, parent_id, sort_order, is_active)
          VALUES (?, ?, ?, ?, ?, TRUE)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            parent_id = VALUES(parent_id),
            description = VALUES(description),
            sort_order = VALUES(sort_order),
            is_active = TRUE
          `,
          [
            item.label,
            item.code,
            item.description || `Route: ${item.path}`,
            parentId,
            childSortOrder,
          ],
        );
        childSortOrder++;
      }

      await connection.commit();
      parentSortOrder++;
    }

    console.log(" ✅ Modules table successfully seeded!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding modules table:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
