// import bcrypt from "bcryptjs";
// import { getDB } from "../../config/db.js";

// export const seedUsers = async () => {
//   const db = getDB();

//   // Get ADMIN role id
//   const [roles] = await db.query(
//     "SELECT id FROM roles WHERE name = ? LIMIT 1",
//     ["ADMIN"],
//   );

//   if (!roles.length) {
//     throw new Error("ADMIN role not found. Run role seed first.");
//   }

//   const adminRoleId = roles[0].id;

//   const passwordHash = await bcrypt.hash("123456", 10);

//   await db.query(
//     `
//     INSERT INTO users (
//       role_id,
//       username,
//       password_hash,
//       mobile,
//       email,
//       status
//     )
//     VALUES (?, ?, ?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE
//       role_id = VALUES(role_id),
//       email = VALUES(email),
//       mobile = VALUES(mobile),
//       status = VALUES(status)
//     `,
//     [
//       adminRoleId,
//       "admin",
//       passwordHash,
//       "1234567890",
//       "admin@example.com",
//       "active",
//     ],
//   );

//   console.log("✅ Admin user seeded");
// };

import bcrypt from "bcryptjs";
import { getDB } from "../../config/db.js";

export const seedUsers = async () => {
  const db = getDB();

  // 1. Fetch all roles to map role names to role IDs dynamically
  const [roleRows] = await db.query(
    "SELECT id, name FROM roles WHERE status = 'active'",
  );

  if (!roleRows.length) {
    throw new Error("No active roles found. Please run seedRoles first.");
  }

  // Create a quick lookup map: { "ADMIN": 1, "SUPER_ADMIN": 2, ... }
  const roleMap = roleRows.reduce((map, role) => {
    map[role.name] = role.id;
    return map;
  }, {});

  // 2. Hash default passwords
  const defaultPasswordHash = await bcrypt.hash("123456", 10);

  // 3. Define users list mapped to their target roles
  const usersToSeed = [
    {
      roleName: "SUPER_ADMIN",
      username: "superadmin",
      email: "superadmin@example.com",
      mobile: "9999999990",
      status: "active",
    },
    {
      roleName: "ADMIN",
      username: "admin",
      email: "admin@example.com",
      mobile: "1234567890",
      status: "active",
    },
    {
      roleName: "BRANCH_MANAGER",
      username: "manager",
      email: "manager@example.com",
      mobile: "9876543210",
      status: "active",
    },
    {
      roleName: "ACCOUNTANT",
      username: "accountant",
      email: "accountant@example.com",
      mobile: "9876543211",
      status: "active",
    },
    {
      roleName: "COLLECTION_AGENT",
      username: "agent",
      email: "agent@example.com",
      mobile: "9876543212",
      status: "active",
    },
    {
      roleName: "CUSTOMER",
      username: "customer1",
      email: "customer1@example.com",
      mobile: "9876543213",
      status: "active",
    },
  ];

  // 4. Upsert users into the database
  for (const user of usersToSeed) {
    const roleId = roleMap[user.roleName];

    if (!roleId) {
      console.warn(
        `⚠️ Role ${user.roleName} not found. Skipping user ${user.username}.`,
      );
      continue;
    }

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
        roleId,
        user.username,
        defaultPasswordHash,
        user.mobile,
        user.email,
        user.status,
      ],
    );
  }

  console.log("✅ All default users seeded successfully.");
};
