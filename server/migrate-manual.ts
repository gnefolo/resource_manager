import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "./db";

async function main() {
    console.log("Starting migration...");
    try {
        const db = await getDb();
        if (!db) {
            throw new Error("Could not connect to database");
        }
        await migrate(db, { migrationsFolder: "drizzle" });
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

main();
