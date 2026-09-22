import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { initDB, getDB } from "./config/db.js";
import runMigrations from "./database/runMigrations.js";
import runSeeds from "./database/runSeeds.js";
import { getLocalIP } from "./utils/network.js";
import {
  startInterestLoanCron,
  stopInterestLoanCron,
} from "./modules/interestLoan/cron/interestLoanCron.scheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 🔥 STEP 1: Init DB (create DB if not exists)
    console.log("🚀 Starting server...");
    await initDB();

    // Run database setup when explicitly enabled for this environment.
    if (process.env.AUTO_MIGRATE === "true") {
      await runMigrations();
    }
    console.log("✅ DB ready for seeding");

    if (process.env.AUTO_SEED === "true") {
      await runSeeds();
    }
    console.log("✅ DB seeded successfully");

    // 🔥 STEP 2: Start Background Schedulers (Daily Accrual & Reconciliation)
    startInterestLoanCron();

    const server = http.createServer(app);
    const localIP = getLocalIP();

    server.listen(PORT, () => {
      console.log("🚀 Server running");
      console.log(`Local: http://localhost:${PORT}`);
      // console.log(`Network: http://${localIP}:${PORT}`);
    });

    // 🔥 STEP 3: Graceful Shutdown Handling (SIGTERM, SIGINT)
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 [Shutdown] Received ${signal}. Initiating graceful shutdown...`);

      // 1. Stop background cron schedulers to prevent new ticks
      stopInterestLoanCron();

      // 2. Stop accepting new HTTP requests and wait for inflight requests
      server.close(async () => {
        console.log("🔒 [Shutdown] HTTP server closed. Inflight requests finished.");
        try {
          const db = getDB();
          if (db) {
            await db.end();
            console.log("🔌 [Shutdown] MySQL connection pool closed.");
          }
        } catch (dbErr) {
          console.error("⚠️ [Shutdown] Error closing MySQL pool:", dbErr.message);
        }
        console.log("👋 [Shutdown] Graceful shutdown completed. Process exiting.");
        process.exit(0);
      });

      // 3. Safety timeout: Force kill if inflight operations exceed 10 seconds
      setTimeout(() => {
        console.error("⏰ [Shutdown] Graceful shutdown timed out (10s). Forcing termination.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

startServer();