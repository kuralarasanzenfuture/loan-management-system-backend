import { getDB } from "../../config/db.js";

export const seedRoles = async () => {
  const db = getDB();

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
    ["ADMIN", "System Administrator with full access", "active", true],
  );

  console.log("✅ ADMIN role seeded");
};
