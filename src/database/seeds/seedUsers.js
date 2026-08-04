import bcrypt from "bcryptjs";
import { getDB } from "../../config/db.js";

export const seedUsers = async () => {
  const db = getDB();

  // Get ADMIN role id
  const [roles] = await db.query(
    "SELECT id FROM roles WHERE name = ? LIMIT 1",
    ["ADMIN"],
  );

  if (!roles.length) {
    throw new Error("ADMIN role not found. Run role seed first.");
  }

  const adminRoleId = roles[0].id;

  const passwordHash = await bcrypt.hash("123456", 10);

  await db.query(
    `
    INSERT INTO users (
      role_id,
      username,
      password_hash,
      mobile,
      email,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      role_id = VALUES(role_id),
      email = VALUES(email),
      mobile = VALUES(mobile),
      status = VALUES(status)
    `,
    [
      adminRoleId,
      "admin",
      passwordHash,
      "1234567890",
      "admin@example.com",
      "active",
    ],
  );

  console.log("✅ Admin user seeded");
};
