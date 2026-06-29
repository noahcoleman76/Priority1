import type {
  AppDataDto,
  CategoryDto,
  CreateTaskInput,
  LoginInput,
  RegisterInput,
  TaskDto,
  UpdateAccountInput,
  UpdateTaskInput,
  UserDto
} from "@priority1/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "priority1_token";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

type ApiOptions = RequestInit & {
  auth?: boolean;
};

const request = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth ?? true) {
    const token = authStorage.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  register: (body: RegisterInput) =>
    request<{ user: UserDto; token: string }>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    }),
  login: (body: LoginInput) =>
    request<{ user: UserDto; token: string }>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    }),
  me: () => request<{ user: UserDto }>("/account/me"),
  updateAccount: (body: UpdateAccountInput) =>
    request<{ user: UserDto }>("/account/me", { method: "PATCH", body: JSON.stringify(body) }),
  appData: () => request<AppDataDto>("/app-data"),
  createTask: (body: CreateTaskInput) =>
    request<{ task: TaskDto }>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (taskId: string, body: UpdateTaskInput) =>
    request<{ task: TaskDto }>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),
  completeTask: (taskId: string) =>
    request<{ task: TaskDto }>(`/tasks/${taskId}/complete`, { method: "POST" }),
  restoreTask: (taskId: string) =>
    request<{ task: TaskDto }>(`/tasks/${taskId}/restore`, { method: "POST" }),
  reorderTasks: (categoryId: string, taskIds: string[]) =>
    request<void>(`/categories/${categoryId}/reorder`, {
      method: "POST",
      body: JSON.stringify({ taskIds })
    }),
  reorderCategories: (categoryIds: string[]) =>
    request<void>("/categories/reorder", {
      method: "POST",
      body: JSON.stringify({ categoryIds })
    }),
  createCategory: (name: string) =>
    request<{ category: CategoryDto }>("/categories", {
      method: "POST",
      body: JSON.stringify({ name })
    })
};
