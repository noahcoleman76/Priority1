import dotenv from "dotenv";

dotenv.config();

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const clientOrigins = (
  process.env.CLIENT_ORIGINS ??
  process.env.CLIENT_ORIGIN ??
  "http://localhost:5173,http://localhost:5174,https://localhost,capacitor://localhost"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  clientOrigins,
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
