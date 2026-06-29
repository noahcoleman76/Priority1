import { Router } from "express";
import { createCategorySchema, reorderCategoriesSchema } from "@priority1/shared";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../errors.js";
import { getNextCategoryOrder, normalizePrismaError } from "./tasks.service.js";
import { toCategoryDto } from "./mappers.js";

const router = Router();

router.get(
  "/categories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
    });
    res.json({ categories: categories.map(toCategoryDto) });
  })
);

router.post(
  "/categories/reorder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = reorderCategoriesSchema.parse(req.body);
    const categories = await prisma.category.findMany({
      where: { userId: req.user!.id },
      select: { id: true }
    }) as Array<{ id: string }>;
    const ownedIds = new Set<string>(categories.map((category) => category.id));

    if (input.categoryIds.some((id) => !ownedIds.has(id))) {
      throw new HttpError(400, "Reorder list contains categories outside this account");
    }

    const omittedIds = [...ownedIds].filter((id) => !input.categoryIds.includes(id));
    const orderedIds = [...input.categoryIds, ...omittedIds];

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: index }
        })
      )
    );

    res.status(204).send();
  })
);

router.post(
  "/categories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createCategorySchema.parse(req.body);
    try {
      const category = await prisma.category.create({
        data: {
          userId: req.user!.id,
          name: input.name,
          displayOrder: await getNextCategoryOrder(req.user!.id)
        }
      });
      res.status(201).json({ category: toCategoryDto(category) });
    } catch (error) {
      normalizePrismaError(error);
    }
  })
);

export { router as categoriesRouter };
