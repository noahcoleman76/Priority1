import bcrypt from "bcryptjs";
import { Router } from "express";
import { updateAccountSchema } from "@priority1/shared";
import { requireAuth } from "../auth/middleware.js";
import { toUserDto } from "../auth/auth.routes.js";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../errors.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    res.json({ user: toUserDto(user) });
  })
);

router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateAccountSchema.parse(req.body);

    if (input.newPassword && !input.currentPassword) {
      throw new HttpError(400, "Current password is required to change password");
    }

    const current = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });

    if (input.currentPassword && !(await bcrypt.compare(input.currentPassword, current.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect");
    }

    if (input.username || input.email) {
      const existing = await prisma.user.findFirst({
        where: {
          id: { not: req.user!.id },
          OR: [
            ...(input.username ? [{ username: input.username }] : []),
            ...(input.email ? [{ email: input.email }] : [])
          ]
        },
        select: { username: true, email: true }
      });

      if (existing?.username === input.username) {
        throw new HttpError(409, "Username is already taken");
      }
      if (existing?.email === input.email) {
        throw new HttpError(409, "Email is already in use");
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        username: input.username,
        email: input.email,
        passwordHash: input.newPassword ? await bcrypt.hash(input.newPassword, 12) : undefined
      }
    });

    res.json({ user: toUserDto(user) });
  })
);

export { router as accountRouter };
