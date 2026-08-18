import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

// Load .env file based on NODE_ENV or default to ".env"
const env = process.env.VITE_NODE_ENV || "uat";
dotenv.config({ path: `.env` });

// Uppercase and build the variable name
const baseURLKey = `VITE_${env.toUpperCase()}_API`;
const baseURL = process.env[baseURLKey];

if (!baseURL) {
  throw new Error(`Missing environment variable: ${baseURLKey}`);
}

export default defineConfig({
  workers: 1, // Run in a single browser instance
  use: {
    baseURL,
  },
});
