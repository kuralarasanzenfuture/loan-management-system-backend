import { getDB } from "../../../config/db.js";

/**
 * Role Permission Defaults Matrix
 * Maps Role Names (Case-Insensitive) to Module Codes and Action Codes.
 * Use '*' for action_code to grant ALL actions under that module.
 */
const ROLE_PERMISSIONS_MATRIX = [
  // ==========================================
  // 1. ADMIN ROLE (Full Super Access)
  // ==========================================
  {
    role_name: "ADMIN",
    access: [
      { module_code: "*", action_code: "*" }, // Grant access to ALL modules and ALL actions
    ],
  },

  // ==========================================
  // 2. MANAGER ROLE (Operations & Approval Access)
  // ==========================================
  {
    role_name: "MANAGER",
    access: [
      { module_code: "MOD_DASHBOARD", action_code: "*" },
      { module_code: "MOD_ANALYTICS", action_code: "*" },
      { module_code: "MOD_CUSTOMERS", action_code: "*" },
      { module_code: "MOD_CUSTOMER_DOCS", action_code: "*" },
      { module_code: "MOD_GUARANTORS", action_code: "*" },
      { module_code: "MOD_LOAN_APPS", action_code: "*" },
      { module_code: "MOD_LOAN_APPROVAL", action_code: "*" },
      { module_code: "MOD_ACTIVE_LOANS", action_code: "*" },
      { module_code: "MOD_LOAN_PLANS", action_code: "*" },
      { module_code: "MOD_LOAN_TYPES", action_code: "*" },
      { module_code: "MOD_INTEREST_RATES", action_code: "*" },
      { module_code: "MOD_PENALTY_RULES", action_code: "*" },
      { module_code: "MOD_LOAN_CLOSURE", action_code: "*" },
      { module_code: "MOD_LOAN_COLLECTIONS", action_code: "*" },
      { module_code: "MOD_EMI_COLLECTION", action_code: "*" },
      { module_code: "MOD_RECEIPTS", action_code: "*" },
      { module_code: "MOD_DUE_COLLECTIONS", action_code: "*" },
      { module_code: "MOD_PENALTY_COLLECTION", action_code: "*" },
      { module_code: "MOD_INCOME", action_code: "*" },
      { module_code: "MOD_EXPENSES", action_code: "*" },
      { module_code: "MOD_CASH_BOOK", action_code: "*" },
      { module_code: "MOD_TRANSACTIONS", action_code: "*" },
      { module_code: "MOD_HAND_LOANS", action_code: "*" },
      { module_code: "MOD_PERSONAL_CHITS", action_code: "*" },
      { module_code: "MOD_ASSET_CATEGORIES", action_code: "*" },
      { module_code: "MOD_ASSETS", action_code: "*" },
      { module_code: "MOD_REP_LOANS", action_code: "*" },
      { module_code: "MOD_REP_INSTALLMENTS", action_code: "*" },
      { module_code: "MOD_REP_COLLECTIONS", action_code: "*" },
      { module_code: "MOD_REP_CUSTOMERS", action_code: "*" },
      { module_code: "MOD_REP_FINANCIAL", action_code: "*" },
    ],
  },

  // ==========================================
  // 3. COLLECTION AGENT / STAFF ROLE (Field Access)
  // ==========================================
  {
    role_name: "COLLECTION_AGENT",
    access: [
      { module_code: "MOD_DASHBOARD", action_code: "VIEW" },
      { module_code: "MOD_CUSTOMERS", action_code: "VIEW" },
      { module_code: "MOD_EMI_COLLECTION", action_code: "VIEW" },
      { module_code: "MOD_EMI_COLLECTION", action_code: "COLLECT_PAYMENT" },
      { module_code: "MOD_RECEIPTS", action_code: "VIEW" },
      { module_code: "MOD_RECEIPTS", action_code: "PRINT" },
      { module_code: "MOD_DUE_COLLECTIONS", action_code: "VIEW" },
      { module_code: "MOD_PENALTY_COLLECTION", action_code: "VIEW" },
      { module_code: "MOD_PENALTY_COLLECTION", action_code: "COLLECT_PENALTY" },
    ],
  },
];

export const SeedRolePermissionsTable = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(
      " ⏳ Seeding Role Permissions into 'role_permissions' table...",
    );

    // 1. Fetch all system roles (indexed by uppercase role name)
    const [roles] = await connection.query("SELECT id, name FROM roles");
    const roleMap = new Map();
    roles.forEach((r) => {
      // Normalize to UPPERCASE to handle 'admin', 'Admin', 'ADMIN' seamlessly
      roleMap.set(r.name.trim().toUpperCase(), r.id);
    });

    // 2. Fetch all module actions with their parent module code
    const [actions] = await connection.query(`
      SELECT ma.id AS action_id, ma.action_code, m.code AS module_code
      FROM module_actions ma
      JOIN modules m ON ma.module_id = m.id
    `);

    let totalPermissionsAssigned = 0;

    for (const roleDef of ROLE_PERMISSIONS_MATRIX) {
      // Lookup role ID matching UPPERCASE role name
      const targetRoleName = roleDef.role_name.trim().toUpperCase();
      const roleId = roleMap.get(targetRoleName);

      if (!roleId) {
        console.warn(
          ` ⚠️ Role '${roleDef.role_name}' not found in database. Skipping.`,
        );
        continue;
      }

      await connection.beginTransaction();

      let targetActions = [];

      for (const rule of roleDef.access) {
        if (rule.module_code === "*" && rule.action_code === "*") {
          // Grant ALL actions across ALL modules
          targetActions = actions;
          break;
        } else if (rule.action_code === "*") {
          // Grant ALL actions within a specific module
          const matched = actions.filter(
            (a) => a.module_code === rule.module_code,
          );
          targetActions.push(...matched);
        } else {
          // Grant specific action within a specific module
          const matched = actions.filter(
            (a) =>
              a.module_code === rule.module_code &&
              a.action_code === rule.action_code,
          );
          targetActions.push(...matched);
        }
      }

      // Remove duplicates if any rules overlapped
      const uniqueActionIds = [
        ...new Set(targetActions.map((a) => a.action_id)),
      ];

      for (const actionId of uniqueActionIds) {
        await connection.query(
          `
          INSERT INTO role_permissions (role_id, action_id, is_allowed)
          VALUES (?, ?, TRUE)
          ON DUPLICATE KEY UPDATE
            is_allowed = TRUE,
            updated_at = CURRENT_TIMESTAMP
          `,
          [roleId, actionId],
        );
        totalPermissionsAssigned++;
      }

      await connection.commit();
    }

    console.log(
      ` ✅ Successfully seeded ${totalPermissionsAssigned} permissions across roles!`,
    );
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding role_permissions table:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
