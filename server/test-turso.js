import { createClient } from "@libsql/client";

const url = "libsql://resource-manager-gnefolo.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc0NDA3NzEsImlkIjoiOTAzNmNjNGUtZjM1Ny00ODVhLTliZDktYzAyN2Q0NDJiZGI5IiwicmlkIjoiNzY5YjlhYzEtNzhjMi00ZmFjLTliMzUtYmU2YTg5M2RjNmYzIn0._S24dCtbolmcnCioijsoxxQz5IvOzp8D6s0VOyJAK83-en1o3v9eExFCgBOKJffvjHLBKLr8mWo-ljm-xQ0NCg";

const client = createClient({
  url,
  authToken,
});

async function main() {
  try {
    const rs = await client.execute("SELECT 1");
    console.log("Connection successful!", rs);
  } catch (e) {
    console.error("Connection failed:", e);
  }
}

main();
