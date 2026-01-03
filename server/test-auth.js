import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    console.log("Hashing password:", password);
    try {
        const salt = randomBytes(16).toString("hex");
        console.log("Salt:", salt);
        const derivedKey = (await scryptAsync(password, salt, 64));
        console.log("Derived Key:", derivedKey.toString("hex"));
        return `${salt}:${derivedKey.toString("hex")}`;
    } catch (e) {
        console.error("Error in hashPassword:", e);
    }
}

hashPassword("password123");
