import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";
import { env } from "@/env";

// Use SHA-256 to derive a 32-byte key from the environment secret
const KEY = createHash("sha256").update(env.NEXTAUTH_SECRET!).digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

interface EncryptedData {
  iv: string;
  authTag: string;
  data: string;
  salt: string;
}

export async function encrypt(data: string): Promise<string> {
  try {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);

    // Derive a unique key for each encryption using PBKDF2
    const uniqueKey = createHash("sha256")
      .update(Buffer.concat([KEY, salt]))
      .digest();

    const cipher = createCipheriv(ALGORITHM, uniqueKey, iv);

    let encryptedData = cipher.update(data, "utf8", "base64");
    encryptedData += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    const result: EncryptedData = {
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      data: encryptedData,
      salt: salt.toString("base64"),
    };

    return Buffer.from(JSON.stringify(result), "utf-8").toString("base64");
  } catch (error) {
    console.error(
      "Encryption error:",
      error instanceof Error ? error.message : String(error),
    );
    throw new Error("Failed to encrypt data");
  }
}

export async function decrypt(encryptedString: string): Promise<string> {
  try {
    const decodedString = Buffer.from(encryptedString, "base64").toString(
      "utf-8",
    );
    const encryptedData = JSON.parse(decodedString) as EncryptedData;

    if (
      !encryptedData?.iv ||
      !encryptedData.authTag ||
      !encryptedData.data ||
      !encryptedData.salt
    ) {
      throw new Error("Invalid encrypted data");
    }

    const iv = Buffer.from(encryptedData.iv, "base64");
    const authTag = Buffer.from(encryptedData.authTag, "base64");
    const salt = Buffer.from(encryptedData.salt, "base64");

    // Derive the same unique key using PBKDF2
    const uniqueKey = createHash("sha256")
      .update(Buffer.concat([KEY, salt]))
      .digest();

    const decipher = createDecipheriv(ALGORITHM, uniqueKey, iv);
    decipher.setAuthTag(authTag);

    let decryptedData = decipher.update(encryptedData.data, "base64", "utf8");
    decryptedData += decipher.final("utf8");

    return decryptedData;
  } catch (error) {
    console.error(
      "Decryption error:",
      error instanceof Error ? error.message : String(error),
    );
    throw new Error("Failed to decrypt data");
  }
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const salt = randomBytes(SALT_LENGTH).toString("hex");
      const hash = createHash("sha512")
        .update(password + salt)
        .digest("hex");
      resolve(`${salt}:${hash}`);
    } catch {
      reject(new Error("Failed to hash password"));
    }
  });
}

export function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const [salt, hash] = hashedPassword.split(":");
      if (!salt || !hash) {
        throw new Error("Invalid hashed password format");
      }
      const verifyHash = createHash("sha512")
        .update(password + salt)
        .digest("hex");
      resolve(hash === verifyHash);
    } catch {
      reject(new Error("Failed to verify password"));
    }
  });
}
