import { initDB } from "../config/db.js";
import { seedRoles } from "./seeds/seedRoles.js";
import { seedUsers } from "./seeds/seedUsers.js";
import { SeedCustomers } from "./seeds/seedCustomers.js";
import { SeedLoanPlans } from "./seeds/SeedLoanPlans.js";
import { SeedCompanyDetails } from "./seeds/seedCompanyDetails.js";
import { SeedCompanyBanks } from "./seeds/seedCompanyBanks.js";

const runSeeds = async () => {
  try {
    await initDB();

    console.log("🌱 Running seeds...");

    // Seed roles
    await seedRoles();

    await seedUsers();
    
    await SeedCustomers();
    
    await SeedLoanPlans();
    
    await SeedCompanyDetails();
    
    await SeedCompanyBanks();

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
