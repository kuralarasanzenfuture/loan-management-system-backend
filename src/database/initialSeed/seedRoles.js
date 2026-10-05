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
    ]
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
