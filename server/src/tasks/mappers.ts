import type { CategoryDto, CategoryWithTasksDto, TaskDto } from "@priority1/shared";

type TaskRecord = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  priorityOrder: number;
  completed: boolean;
  completedAt: Date | null;
  recurrenceType: string | null;
  recurrenceDays: number[];
  recurrenceAnchor: Date | null;
  nextDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryRecord = {
  id: string;
  name: string;
  displayOrder: number;
};

export const toTaskDto = (task: TaskRecord): TaskDto => ({
  id: task.id,
  categoryId: task.categoryId,
  title: task.title,
  description: task.description,
  priorityOrder: task.priorityOrder,
  completed: task.completed,
  completedAt: task.completedAt?.toISOString() ?? null,
  recurrenceType: task.recurrenceType as TaskDto["recurrenceType"],
  recurrenceDays: task.recurrenceDays,
  recurrenceAnchor: task.recurrenceAnchor?.toISOString() ?? null,
  nextDueAt: task.nextDueAt?.toISOString() ?? null,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString()
});

export const toCategoryDto = (category: CategoryRecord): CategoryDto => ({
  id: category.id,
  name: category.name,
  displayOrder: category.displayOrder
});

export const toCategoryWithTasksDto = (
  category: CategoryRecord & { tasks: TaskRecord[] }
): CategoryWithTasksDto => ({
  ...toCategoryDto(category),
  activeTasks: category.tasks.filter((task) => !task.completed).map(toTaskDto),
  completedTasks: category.tasks.filter((task) => task.completed).map(toTaskDto)
});
