import { initDB } from "../config/db.js";
import { seedRoles } from "./seeds/seedRoles.js";
import { seedUsers } from "./seeds/seedUsers.js";

const runSeeds = async () => {
  try {
    await initDB();

    console.log("🌱 Running seeds...");

    // Seed roles
    await seedRoles();

    await seedUsers();

    console.log("✅ Seeding completed");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    throw err; // Let server.js handle the error
  }
};

export default runSeeds;

// Allow CLI execution only
if (process.argv[1]?.includes("runSeeds.js")) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
