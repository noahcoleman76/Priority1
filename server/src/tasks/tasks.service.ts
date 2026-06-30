import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

export type RecurrenceType = "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | "biweekly" | "custom";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonthsClamped = (date: Date, months: number) => {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
};

const addYearsClamped = (date: Date, years: number) => {
  const result = new Date(date);
  const month = result.getMonth();
  const day = result.getDate();
  result.setFullYear(result.getFullYear() + years, month, 1);
  const lastDay = new Date(result.getFullYear(), month + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
};

const isAllowedWeekday = (date: Date, days: number[]) => days.includes(date.getDay());

export const normalizeRecurrenceDays = (type: RecurrenceType | null | undefined, days: number[] = []) => {
  if (!type) {
    return [];
  }
  if (type === "weekdays") {
    return [1, 2, 3, 4, 5];
  }
  if (type === "custom") {
    return [...new Set(days)].sort((a, b) => a - b);
  }
  return [];
};

export const getInitialNextDueAt = (type: RecurrenceType | null | undefined, days: number[] = [], from = new Date()) => {
  if (!type) {
    return null;
  }

  const today = startOfDay(from);
  if ((type === "weekdays" || type === "custom") && !isAllowedWeekday(today, normalizeRecurrenceDays(type, days))) {
    return getNextDueAt(type, days, today, today);
  }
  return today;
};

export const getNextDueAt = (
  type: RecurrenceType,
  days: number[] = [],
  after = new Date(),
  anchor = new Date()
) => {
  const afterDay = startOfDay(after);
  const normalizedDays = normalizeRecurrenceDays(type, days);

  if (type === "daily") {
    return addDays(afterDay, 1);
  }

  if (type === "weekdays" || type === "custom") {
    if (normalizedDays.length === 0) {
      return addDays(afterDay, 1);
    }
    let candidate = addDays(afterDay, 1);
    while (!isAllowedWeekday(candidate, normalizedDays)) {
      candidate = addDays(candidate, 1);
    }
    return candidate;
  }

  if (type === "weekly") {
    return addDays(afterDay, 7);
  }

  if (type === "biweekly") {
    const anchorDay = startOfDay(anchor);
    let candidate = anchorDay;
    while (candidate <= afterDay) {
      candidate = addDays(candidate, 14);
    }
    return candidate;
  }

  if (type === "monthly") {
    return addMonthsClamped(afterDay, 1);
  }

  return addYearsClamped(afterDay, 1);
};

export const refreshDueRecurringTasks = async (userId: string) => {
  const now = new Date();
  const dueTasks = await prisma.task.findMany({
    where: {
      userId,
      recurrenceType: { not: null },
      nextDueAt: { lte: now }
    }
  });

  await Promise.all(
    dueTasks.map((task) => {
      const recurrenceType = task.recurrenceType as RecurrenceType;
      return prisma.task.update({
        where: { id: task.id },
        data: {
          completed: false,
          completedAt: null,
          nextDueAt: getNextDueAt(
            recurrenceType,
            task.recurrenceDays,
            now,
            task.recurrenceAnchor ?? task.createdAt
          )
        }
      });
    })
  );
};

export const listAppData = async (userId: string) => {
  await refreshDueRecurringTasks(userId);
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      tasks: {
        orderBy: [{ completed: "asc" }, { priorityOrder: "asc" }, { completedAt: "desc" }]
      }
    }
  });
};

export const getNextCategoryOrder = async (userId: string) => {
  const aggregate = await prisma.category.aggregate({
    where: { userId },
    _max: { displayOrder: true }
  });
  return (aggregate._max.displayOrder ?? -1) + 1;
};

export const getNextTaskOrder = async (userId: string, categoryId: string) => {
  const aggregate = await prisma.task.aggregate({
    where: { userId, categoryId, completed: false },
    _max: { priorityOrder: true }
  });
  return (aggregate._max.priorityOrder ?? -1) + 1;
};

export const assertCategoryOwner = async (userId: string, categoryId: string) => {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new HttpError(404, "Category not found");
  }
  return category;
};

export const reorderCategoryTasks = async (userId: string, categoryId: string, taskIds: string[]) => {
  const tasks = await prisma.task.findMany({
    where: { userId, categoryId, completed: false },
    select: { id: true }
  }) as Array<{ id: string }>;
  const activeIds = new Set<string>(tasks.map((task) => task.id));

  if (taskIds.some((id) => !activeIds.has(id))) {
    throw new HttpError(400, "Reorder list contains tasks outside this active category");
  }

  const omittedIds = [...activeIds].filter((id) => !taskIds.includes(id));
  const orderedIds = [...taskIds, ...omittedIds];

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { priorityOrder: index }
      })
    )
  );
};

export const normalizePrismaError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new HttpError(409, "A record with that value already exists");
  }
  throw error;
};
