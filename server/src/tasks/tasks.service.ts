import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

export const listAppData = async (userId: string) => {
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
