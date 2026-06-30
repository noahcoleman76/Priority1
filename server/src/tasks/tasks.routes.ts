import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { createTaskSchema, reorderTasksSchema, updateTaskSchema } from "@priority1/shared";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../errors.js";
import { toCategoryWithTasksDto, toTaskDto } from "./mappers.js";
import {
  assertCategoryOwner,
  getInitialNextDueAt,
  getNextCategoryOrder,
  getNextDueAt,
  getNextTaskOrder,
  listAppData,
  normalizeRecurrenceDays,
  normalizePrismaError,
  RecurrenceType,
  reorderCategoryTasks
} from "./tasks.service.js";

const router = Router();

router.get(
  "/app-data",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categories = await listAppData(req.user!.id);
    res.json({ categories: categories.map(toCategoryWithTasksDto) });
  })
);

router.post(
  "/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createTaskSchema.parse(req.body);

    if (!input.categoryId && !input.newCategoryName) {
      throw new HttpError(400, "Choose a category or create a new one");
    }
    if (input.recurrenceType === "custom" && input.recurrenceDays.length === 0) {
      throw new HttpError(400, "Choose at least one custom recurrence day");
    }

    try {
      const task = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const category = input.categoryId
          ? await tx.category.findFirst({ where: { id: input.categoryId, userId: req.user!.id } })
          : await tx.category.create({
              data: {
                userId: req.user!.id,
                name: input.newCategoryName!,
                displayOrder: await getNextCategoryOrder(req.user!.id)
              }
            });

        if (!category) {
          throw new HttpError(404, "Category not found");
        }

        const recurrenceType = input.recurrenceType ?? null;
        const recurrenceDays = normalizeRecurrenceDays(recurrenceType, input.recurrenceDays);
        const recurrenceAnchor = recurrenceType ? new Date() : null;

        return tx.task.create({
          data: {
            userId: req.user!.id,
            categoryId: category.id,
            title: input.title,
            description: input.description,
            priorityOrder: await getNextTaskOrder(req.user!.id, category.id),
            recurrenceType,
            recurrenceDays,
            recurrenceAnchor,
            nextDueAt: getInitialNextDueAt(recurrenceType, recurrenceDays)
          }
        });
      });

      res.status(201).json({ task: toTaskDto(task) });
    } catch (error) {
      normalizePrismaError(error);
    }
  })
);

router.patch(
  "/tasks/:taskId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateTaskSchema.parse(req.body);
    const taskId = String(req.params.taskId);
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId: req.user!.id }
    });

    if (!existing) {
      throw new HttpError(404, "Task not found");
    }

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      await assertCategoryOwner(req.user!.id, input.categoryId);
    }
    if (input.recurrenceType === "custom" && (input.recurrenceDays ?? []).length === 0) {
      throw new HttpError(400, "Choose at least one custom recurrence day");
    }

    const recurrenceType =
      input.recurrenceType === undefined ? existing.recurrenceType : input.recurrenceType;
    const recurrenceDays =
      input.recurrenceType === undefined && input.recurrenceDays === undefined
        ? existing.recurrenceDays
        : normalizeRecurrenceDays(recurrenceType as RecurrenceType | null, input.recurrenceDays ?? []);
    const recurrenceChanged =
      input.recurrenceType !== undefined || input.recurrenceDays !== undefined;

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        priorityOrder:
          input.categoryId && input.categoryId !== existing.categoryId
            ? await getNextTaskOrder(req.user!.id, input.categoryId)
            : undefined,
        recurrenceType,
        recurrenceDays,
        recurrenceAnchor: recurrenceChanged && recurrenceType ? new Date() : recurrenceType ? undefined : null,
        nextDueAt:
          recurrenceChanged && recurrenceType
            ? getInitialNextDueAt(recurrenceType as RecurrenceType, recurrenceDays)
            : recurrenceType
              ? undefined
              : null
      }
    });

    res.json({ task: toTaskDto(task) });
  })
);

router.delete(
  "/tasks/:taskId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const taskId = String(req.params.taskId);
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: req.user!.id } });

    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    await prisma.task.delete({ where: { id: task.id } });
    res.status(204).send();
  })
);

router.post(
  "/tasks/:taskId/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const taskId = String(req.params.taskId);
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: req.user!.id } });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    const recurrenceType = task.recurrenceType as RecurrenceType | null;
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        completed: true,
        completedAt: new Date(),
        nextDueAt: recurrenceType
          ? getNextDueAt(recurrenceType, task.recurrenceDays, new Date(), task.recurrenceAnchor ?? task.createdAt)
          : undefined
      }
    });

    res.json({ task: toTaskDto(updated) });
  })
);

router.post(
  "/tasks/:taskId/restore",
  requireAuth,
  asyncHandler(async (req, res) => {
    const taskId = String(req.params.taskId);
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: req.user!.id } });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        completed: false,
        completedAt: null,
        priorityOrder: await getNextTaskOrder(req.user!.id, task.categoryId)
      }
    });

    res.json({ task: toTaskDto(updated) });
  })
);

router.post(
  "/categories/:categoryId/reorder",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = reorderTasksSchema.parse(req.body);
    const categoryId = String(req.params.categoryId);
    await assertCategoryOwner(req.user!.id, categoryId);
    await reorderCategoryTasks(req.user!.id, categoryId, input.taskIds);
    res.status(204).send();
  })
);

export { router as tasksRouter };
