import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: process.cwd() + "/.env" });

let pool;

export const initDB = async() => {
    try {
        // 🔹 Step 1: connect without database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        // 🔹 Step 2: create database if not exists
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``,
        );

        await connection.end();

        console.log("✅ Database ready");

        // 🔹 Step 3: create pool with database
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,

            waitForConnections: true,
            connectionLimit: 10,
            timezone: "+05:30",
            dateStrings: true,
        });

        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();

        console.log("✅ DB Pool created");
    } catch (err) {
        console.error("❌ DB Init Failed:", err.message);
        process.exit(1);
    }
};

// getter (important)
export const getDB = () => {
    if (!pool) throw new Error("DB not initialized");
    return pool;
};