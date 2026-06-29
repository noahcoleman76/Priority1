import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type AuthTokenPayload = {
  sub: string;
  username: string;
};

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
