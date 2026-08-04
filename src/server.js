import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { initDB } from "./config/db.js";
import runMigrations from "./database/runMigrations.js";
import runSeeds from "./database/runSeeds.js";
import { getLocalIP } from "./utils/network.js";

const PORT = process.env.PORT || 5000;

const startServer = async() => {
    try {
        // 🔥 STEP 1: Init DB (create DB if not exists)
        console.log("🚀 Starting server...");
        await initDB();

        // 🔥 STEP 2: Run migrations (ONLY if enabled)
        // console.log("AUTO_MIGRATE:", process.env.AUTO_MIGRATE);
        // if (process.env.AUTO_MIGRATE === "true") {
        //   await runMigrations();
        // }
        // console.log("✅ DB ready for seeding");

        // if (process.env.AUTO_SEED === "true") {
        //   await runSeeds();
        // }
        // console.log("✅ DB seeded successfully");

        const server = http.createServer(app);
        // const HOST = "0.0.0.0";
        const localIP = getLocalIP();

        server.listen(PORT, () => {
            console.log("🚀 Server running");
            console.log(`Local: http://localhost:${PORT}`);
            // console.log(`Network: http://${localIP}:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Server failed to start:", err.message);
        process.exit(1);
    }
};

startServer();