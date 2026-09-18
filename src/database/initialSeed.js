import { initDB } from "../config/db.js";
import { seedRoles } from "./initialSeed/seedRoles.js";
import { seedUsers } from "./initialSeed/seedUsers.js";
import { SeedModulesTable } from "./seeds/permissions/seedModules.js";
import { SeedModuleActionsTable } from "./seeds/permissions/seedModuleActions.js";
import { SeedRolePermissionsTable } from "./seeds/permissions/seedRolePermissions.js";

const runSeeds = async () => {
  try {
    await initDB();

    console.log("🌱 Running seeds...");

    // Seed roles
    await seedRoles();

    await seedUsers();

    await SeedModulesTable();

    await SeedModuleActionsTable();

    await SeedRolePermissionsTable();

    console.log("✅ Seeding completed");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    throw err; // Let server.js handle the error
  }
};

export default runSeeds;

// Allow CLI execution only
if (process.argv[1]?.endsWith("initialSeed.js")) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
