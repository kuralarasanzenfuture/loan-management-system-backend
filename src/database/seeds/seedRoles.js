// import { getDB } from "../../config/db.js";

// export const seedRoles = async () => {
//   const db = getDB();

//   await db.query(
//     `
//     INSERT INTO roles (
//       name,
//       description,
//       status,
//       is_system
//     )
//     VALUES (?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE
//       description = VALUES(description),
//       status = VALUES(status),
//       is_system = VALUES(is_system)
//     `,
//     ["ADMIN", "System Administrator with full access", "active", true],
//   );

//   console.log("✅ ADMIN role seeded");
// };

import { getDB } from "../../config/db.js";

export const seedRoles = async () => {
  const db = getDB();

  // Define default system roles
  const roles = [
    [
      "SUPER_ADMIN",
      "Super Administrator with unrestricted global access",
      "active",
      true,
    ],
    [
      "ADMIN",
      "System Administrator with full management access",
      "active",
      true,
    ],
    [
      "BRANCH_MANAGER",
      "Branch Manager to oversee loans, customers, and daily operations",
      "active",
      false,
    ],
    [
      "ACCOUNTANT",
      "Financial officer for accounts, bank transactions, and reports",
      "active",
      false,
    ],
    [
      "COLLECTION_AGENT",
      "Field agent for daily/weekly loan collections and recovery",
      "active",
      false,
    ],
    [
      "CUSTOMER",
      "Standard client user role for portal viewing",
      "active",
      false,
    ],
  ];

  try {
    for (const role of roles) {
      await db.query(
        `
        INSERT INTO roles (
          name,
          description,
          status,
          is_system
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          status = VALUES(status),
          is_system = VALUES(is_system)
        `,
        role,
      );
    }

    console.log(
      "✅ Roles seeded successfully:",
      roles.map((r) => r[0]).join(", "),
    );
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    throw error;
  }
};
