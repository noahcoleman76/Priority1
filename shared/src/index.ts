import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(40),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export const updateAccountSchema = z.object({
  username: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email().max(255).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional()
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).optional().default(""),
  categoryId: z.string().uuid().optional(),
  newCategoryName: z.string().trim().min(1).max(80).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().max(5000).optional(),
  categoryId: z.string().uuid().optional()
});

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1)
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

export type UserDto = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  displayOrder: number;
};

export type TaskDto = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  priorityOrder: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryWithTasksDto = CategoryDto & {
  activeTasks: TaskDto[];
  completedTasks: TaskDto[];
};

export type AppDataDto = {
  categories: CategoryWithTasksDto[];
};
