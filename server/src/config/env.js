import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    throw new Error("JWT_SECRET is required in production");
  }
  console.warn("[env] JWT_SECRET is not set; using a development-only fallback.");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL: process.env.DATABASE_URL || "",
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
};
