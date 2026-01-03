import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  // driver: "turso", // This is sometimes implied by authToken presence, but explicit is better if supported. 
  // actually for latest drizzle-kit, 'turso' is not a valid 'driver' string in types usually? 
  // Let's rely on dialect "sqlite" + dbCredentials
  dbCredentials: {
    url: connectionString,
    token: process.env.DATABASE_AUTH_TOKEN,
  },
});
