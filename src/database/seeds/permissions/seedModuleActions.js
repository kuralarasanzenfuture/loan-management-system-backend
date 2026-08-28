import { getDB } from "../../../config/db.js";

// Standard action configurations reusable across modules
const STANDARD_CRUD_ACTIONS = [
  {
    action_code: "VIEW",
    action_name: "View",
    description: "View records and list data",
  },
  {
    action_code: "CREATE",
    action_name: "Create",
    description: "Create new records",
  },
  {
    action_code: "EDIT",
    action_name: "Edit",
    description: "Modify existing records",
  },
  {
    action_code: "DELETE",
    action_name: "Delete",
    description: "Remove records",
  },
  {
    action_code: "EXPORT",
    action_name: "Export",
    description: "Export data to Excel/PDF/CSV",
  },
];

const READ_ONLY_ACTIONS = [
  {
    action_code: "VIEW",
    action_name: "View",
    description: "View records and list data",
  },
  {
    action_code: "EXPORT",
    action_name: "Export",
    description: "Export data to Excel/PDF/CSV",
  },
];

// Mapping module codes to their specific granular permissions/actions
const MODULE_ACTIONS_CONFIG = {
  // --- Dashboard & Analytics ---
  MOD_DASHBOARD: [
    {
      action_code: "VIEW",
      action_name: "View Dashboard",
      description: "Access main dashboard metrics",
    },
  ],
  MOD_ANALYTICS: READ_ONLY_ACTIONS,

  // --- Customer Management ---
  MOD_CUSTOMERS: [
    ...STANDARD_CRUD_ACTIONS,
    {
      action_code: "VERIFY_KYC",
      action_name: "Verify KYC",
      description: "Approve customer identity and KYC documents",
    },
  ],
  MOD_CUSTOMER_DOCS: STANDARD_CRUD_ACTIONS,
  MOD_GUARANTORS: STANDARD_CRUD_ACTIONS,

  // --- Loan Management ---
  MOD_LOAN_APPS: [
    ...STANDARD_CRUD_ACTIONS,
    {
      action_code: "SUBMIT",
      action_name: "Submit Application",
      description: "Submit loan application for review",
    },
    {
      action_code: "CANCEL",
      action_name: "Cancel Application",
      description: "Cancel pending application",
    },
  ],
  MOD_LOAN_APPROVAL: [
    {
      action_code: "VIEW",
      action_name: "View Approval Queue",
      description: "View pending loan approvals",
    },
    {
      action_code: "APPROVE",
      action_name: "Approve Loan",
      description: "Grant final approval for loan application",
    },
    {
      action_code: "REJECT",
      action_name: "Reject Loan",
      description: "Decline loan application",
    },
    {
      action_code: "DISBURSE",
      action_name: "Disburse Funds",
      description: "Trigger loan amount disbursement",
    },
  ],
  MOD_ACTIVE_LOANS: READ_ONLY_ACTIONS,
  MOD_LOAN_PLANS: STANDARD_CRUD_ACTIONS,
  MOD_LOAN_TYPES: STANDARD_CRUD_ACTIONS,
  MOD_INTEREST_RATES: STANDARD_CRUD_ACTIONS,
  MOD_PENALTY_RULES: STANDARD_CRUD_ACTIONS,
  MOD_LOAN_CLOSURE: [
    {
      action_code: "VIEW",
      action_name: "View Closures",
      description: "View completed and pending loan closures",
    },
    {
      action_code: "CLOSE_LOAN",
      action_name: "Execute Closure",
      description: "Mark loan account as fully settled/closed",
    },
    {
      action_code: "GENERATE_NOC",
      action_name: "Generate NOC",
      description: "Issue No Objection Certificate",
    },
  ],

  // --- Collections ---
  MOD_LOAN_COLLECTIONS: READ_ONLY_ACTIONS,
  MOD_EMI_COLLECTION: [
    {
      action_code: "VIEW",
      action_name: "View Collection Ledger",
      description: "View collection entries",
    },
    {
      action_code: "COLLECT_PAYMENT",
      action_name: "Collect EMI",
      description: "Record new EMI payment entry",
    },
    {
      action_code: "REVERSE_PAYMENT",
      action_name: "Reverse Entry",
      description: "Rollback erroneous collection entry",
    },
  ],
  MOD_RECEIPTS: [
    ...READ_ONLY_ACTIONS,
    {
      action_code: "PRINT",
      action_name: "Print Receipt",
      description: "Print physical payment receipts",
    },
  ],
  MOD_DUE_COLLECTIONS: READ_ONLY_ACTIONS,
  MOD_PENALTY_COLLECTION: [
    {
      action_code: "VIEW",
      action_name: "View Penalty Ledger",
      description: "View outstanding penalty records",
    },
    {
      action_code: "COLLECT_PENALTY",
      action_name: "Collect Penalty",
      description: "Record penalty payment collection",
    },
    {
      action_code: "WAIVE_PENALTY",
      action_name: "Waive Penalty",
      description: "Waive or discount overdue penalty fee",
    },
  ],

  // --- Finance ---
  MOD_INCOME: STANDARD_CRUD_ACTIONS,
  MOD_EXPENSES: [
    ...STANDARD_CRUD_ACTIONS,
    {
      action_code: "APPROVE_EXPENSE",
      action_name: "Approve Expense",
      description: "Authorize operational expense payout",
    },
  ],
  MOD_CASH_BOOK: [
    {
      action_code: "VIEW",
      action_name: "View Cash Register",
      description: "Access cash in/out register",
    },
    {
      action_code: "RECORD_ENTRY",
      action_name: "Record Entry",
      description: "Post manual cash entry",
    },
  ],
  MOD_TRANSACTIONS: READ_ONLY_ACTIONS,

  // --- Hand Loans & Personal Chits ---
  MOD_HAND_LOANS: STANDARD_CRUD_ACTIONS,
  MOD_PERSONAL_CHITS: STANDARD_CRUD_ACTIONS,

  // --- Organization ---
  MOD_BRANCHES: STANDARD_CRUD_ACTIONS,
  MOD_COMPANIES: STANDARD_CRUD_ACTIONS,
  MOD_BANK_ACCOUNTS: STANDARD_CRUD_ACTIONS,
  MOD_BANK_TRANSACTIONS: STANDARD_CRUD_ACTIONS,
  MOD_ASSET_CATEGORIES: STANDARD_CRUD_ACTIONS,
  MOD_ASSETS: STANDARD_CRUD_ACTIONS,

  // --- Administration ---
  MOD_USERS: [
    ...STANDARD_CRUD_ACTIONS,
    {
      action_code: "RESET_PASSWORD",
      action_name: "Reset Password",
      description: "Trigger password reset for user",
    },
    {
      action_code: "TOGGLE_STATUS",
      action_name: "Enable/Disable User",
      description: "Activate or suspend user access",
    },
  ],
  MOD_ROLES: STANDARD_CRUD_ACTIONS,
  MOD_ROLE_PERMISSIONS: [
    {
      action_code: "VIEW",
      action_name: "View Permissions Matrix",
      description: "View assigned role permissions",
    },
    {
      action_code: "UPDATE_PERMISSIONS",
      action_name: "Update Permissions",
      description: "Assign or revoke actions per role",
    },
  ],
  MOD_AUDIT_LOGS: READ_ONLY_ACTIONS,

  // --- Communication ---
  MOD_SMS: [
    {
      action_code: "VIEW",
      action_name: "View Logs",
      description: "View SMS dispatch history",
    },
    {
      action_code: "SEND_SMS",
      action_name: "Send SMS",
      description: "Trigger manual SMS dispatch",
    },
  ],
  MOD_EMAIL: [
    {
      action_code: "VIEW",
      action_name: "View Logs",
      description: "View Email dispatch history",
    },
    {
      action_code: "SEND_EMAIL",
      action_name: "Send Email",
      description: "Trigger manual email notification",
    },
  ],
  MOD_NOTIFICATIONS: READ_ONLY_ACTIONS,

  // --- Reports ---
  MOD_REP_LOANS: READ_ONLY_ACTIONS,
  MOD_REP_INSTALLMENTS: READ_ONLY_ACTIONS,
  MOD_REP_COLLECTIONS: READ_ONLY_ACTIONS,
  MOD_REP_CUSTOMERS: READ_ONLY_ACTIONS,
  MOD_REP_FINANCIAL: READ_ONLY_ACTIONS,

  // --- System ---
  MOD_SETTINGS: [
    {
      action_code: "VIEW",
      action_name: "View Settings",
      description: "Access system configuration settings",
    },
    {
      action_code: "UPDATE",
      action_name: "Update Settings",
      description: "Modify system configuration parameters",
    },
  ],
  MOD_DB_BACKUP: [
    {
      action_code: "VIEW",
      action_name: "View Backups",
      description: "View database backup archives",
    },
    {
      action_code: "CREATE_BACKUP",
      action_name: "Generate Backup",
      description: "Trigger immediate manual DB backup",
    },
    {
      action_code: "RESTORE_BACKUP",
      action_name: "Restore Backup",
      description: "Execute DB restoration from file",
    },
  ],
  MOD_ACTIVITY_LOGS: READ_ONLY_ACTIONS,
};

export const SeedModuleActionsTable = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(" ⏳ Seeding Module Actions into 'module_actions' table...");

    // 1. Fetch existing modules map (code => id)
    const [modules] = await connection.query(
      "SELECT id, code, parent_id FROM modules",
    );
    const moduleMap = new Map();
    modules.forEach((mod) => {
      moduleMap.set(mod.code, mod.id);
    });

    let totalInserted = 0;

    for (const [moduleCode, actions] of Object.entries(MODULE_ACTIONS_CONFIG)) {
      const moduleId = moduleMap.get(moduleCode);

      if (!moduleId) {
        console.warn(
          ` ⚠️ Module Code '${moduleCode}' not found in 'modules' table. Skipping actions.`,
        );
        continue;
      }

      await connection.beginTransaction();

      for (const action of actions) {
        await connection.query(
          `
          INSERT INTO module_actions (module_id, action_code, action_name, description, is_active)
          VALUES (?, ?, ?, ?, TRUE)
          ON DUPLICATE KEY UPDATE
            action_name = VALUES(action_name),
            description = VALUES(description),
            is_active = TRUE
          `,
          [
            moduleId,
            action.action_code,
            action.action_name,
            action.description || null,
          ],
        );
        totalInserted++;
      }

      await connection.commit();
    }

    console.log(
      ` ✅ Successfully seeded ${totalInserted} module actions across all modules!`,
    );
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding module_actions table:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
