import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    console.log("Hashing password:", typeof password, password.length);
    try {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = (await scryptAsync(password, salt, 64));
        console.log("Success");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

hashPassword("");
