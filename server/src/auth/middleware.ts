import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors.js";
import { verifyAuthToken } from "./tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
};
