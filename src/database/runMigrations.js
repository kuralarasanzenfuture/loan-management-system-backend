// /* BULLETPROOF MIGRATION RUNNER */

// import fs from "fs";
// import path from "path";
// import { initDB, getDB } from "../config/db.js";

// const MIGRATIONS_DIR = path.join(process.cwd(), "src/database/migrations");

// const log = {
//   info: (msg) => console.log(`ℹ️  ${msg}`),
//   success: (msg) => console.log(`✅ ${msg}`),
//   error: (msg) => console.error(`❌ ${msg}`),
// };

// const runMigrations = async () => {
//   await initDB();
//   const db = getDB();

//   // 🔹 ensure migrations table exists
//   await db.query(`
//     CREATE TABLE IF NOT EXISTS migrations (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255) UNIQUE,
//       status ENUM('pending','success','failed') DEFAULT 'pending',
//       executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   const files = fs.readdirSync(MIGRATIONS_DIR).sort();

//   const [executedRows] = await db.query(`SELECT name, status FROM migrations`);

//   const executedMap = new Map();
//   executedRows.forEach((m) => executedMap.set(m.name, m.status));

//   for (const file of files) {
//     const already = executedMap.get(file);

//     if (already === "success") {
//       log.info(`Skipping already executed: ${file}`);
//       continue;
//     }

//     const filePath = path.join(MIGRATIONS_DIR, file);
//     const sql = fs.readFileSync(filePath, "utf-8");

//     const conn = await db.getConnection();

//     try {
//       log.info(`Running: ${file}`);

//       await conn.beginTransaction();

//       // mark as pending (or update)
//       await conn.query(
//         `INSERT INTO migrations (name, status)
//          VALUES (?, 'pending')
//          ON DUPLICATE KEY UPDATE status='pending'`,
//         [file],
//       );

//       // 🔥 run SQL
//       await conn.query(sql);

//       // mark success
//       await conn.query(`UPDATE migrations SET status='success' WHERE name=?`, [
//         file,
//       ]);

//       await conn.commit();
//       log.success(`Completed: ${file}`);
//     } catch (err) {
//       await conn.rollback();

//       await conn.query(`UPDATE migrations SET status='failed' WHERE name=?`, [
//         file,
//       ]);

//       log.error(`Failed: ${file}`);
//       log.error(err.message);

//       // 🔥 STOP execution immediately
//       throw new Error(`Migration stopped at: ${file}`);
//     } finally {
//       conn.release();
//     }
//   }

//   log.success("All migrations are up to date");
// };

// // runMigrations()
// //   .then(() => {
// //     console.log("🎉 Migration completed.");
// //     process.exit(0);
// //   })
// //   .catch((err) => {
// //     console.error(err);
// //     process.exit(1);
// //   });

// export default runMigrations;

/* fix migration runner */

import fs from "fs";
import path from "path";
import { initDB, getDB } from "../config/db.js";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/database/migrations");

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

const runMigrations = async () => {
  await initDB();
  const db = getDB();

  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE,
      status ENUM('pending','success','failed') DEFAULT 'pending',
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  let files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();

  if (!files.length) {
    log.error("No migration files found!");
    process.exit(1);
  }

  const [executedRows] = await db.query(`SELECT name, status FROM migrations`);

  const executedMap = new Map();
  executedRows.forEach((m) => executedMap.set(m.name, m.status));

  let executedCount = 0;

  for (const file of files) {
    const already = executedMap.get(file);

    if (already === "success") {
      log.info(`Skipping: ${file}`);
      continue;
    }

    if (already === "failed") {
      throw new Error(`Fix failed migration first: ${file}`);
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    const conn = await db.getConnection();

    try {
      log.info(`Running: ${file}`);

      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO migrations (name, status)
         VALUES (?, 'pending')
         ON DUPLICATE KEY UPDATE status='pending'`,
        [file],
      );

      await conn.query(sql);

      await conn.query(`UPDATE migrations SET status='success' WHERE name=?`, [
        file,
      ]);

      await conn.commit();

      executedCount++;
      log.success(`Done: ${file}`);
    } catch (err) {
      await conn.rollback();

      await conn.query(`UPDATE migrations SET status='failed' WHERE name=?`, [
        file,
      ]);

      log.error(`Failed: ${file}`);
      log.error(err.message);

      throw err;
    } finally {
      conn.release();
    }
  }

  log.success(`Executed ${executedCount} migrations`);
};

export default runMigrations;

// Allow CLI execution without running migrations when imported by the server.
if (process.argv[1]?.endsWith("runMigrations.js")) {
  runMigrations()
    .then(() => {
      console.log("🎉 Migration completed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
