import bcrypt from "bcryptjs";
import { Router } from "express";
import { loginSchema, registerSchema, type UserDto } from "@priority1/shared";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../errors.js";
import { signAuthToken } from "./tokens.js";

const router = Router();

const toUserDto = (user: {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): UserDto => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: input.username }, { email: input.email }] },
      select: { username: true, email: true }
    });

    if (existing?.username === input.username) {
      throw new HttpError(409, "Username is already taken");
    }

    if (existing?.email === input.email) {
      throw new HttpError(409, "Email is already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash
      }
    });

    const token = signAuthToken({ sub: user.id, username: user.username });
    res.status(201).json({ user: toUserDto(user), token });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { username: input.username } });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid username or password");
    }

    const token = signAuthToken({ sub: user.id, username: user.username });
    res.json({ user: toUserDto(user), token });
  })
);

export { router as authRouter, toUserDto };
