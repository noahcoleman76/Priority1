import { FormEvent, useState } from "react";
import type { CategoryWithTasksDto, TaskDto } from "@priority1/shared";
import { Check, GripVertical, RotateCcw, Trash2 } from "lucide-react";
import { api } from "../../api/client";

type Props = {
  task: TaskDto;
  categories: CategoryWithTasksDto[];
  dragHandle?: React.ReactNode;
  onChanged: () => Promise<void>;
  completed?: boolean;
};

export const TaskCard = ({ task, categories, dragHandle, onChanged, completed = false }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    categoryId: task.categoryId
  });
  const [error, setError] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const complete = async () => {
    setIsCompleting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    await api.completeTask(task.id);
    await onChanged();
  };

  const deleteTask = async () => {
    await api.deleteTask(task.id);
    await onChanged();
  };

  const restore = async () => {
    await api.restoreTask(task.id);
    await onChanged();
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await api.updateTask(task.id, form);
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task");
    }
  };

  return (
    <article className={`task-card ${completed ? "completed-card" : ""} ${isCompleting ? "task-card-completing" : ""}`}>
      <div className="task-card-top">
        <button className="task-title-button" onClick={() => setExpanded((value) => !value)}>
          {task.title}
        </button>
        <div className="task-actions">
          {dragHandle ?? <GripVertical size={18} className="drag-placeholder" />}
          {completed ? (
            <button className="small-button" onClick={restore}>
              <RotateCcw size={16} />
              Restore
            </button>
          ) : (
            <>
            <button
              className={`task-icon-action complete-action ${isCompleting ? "complete-action-done" : ""}`}
              onClick={complete}
              aria-label="Complete task"
              title="Complete task"
            >
              <Check size={16} />
            </button>
            <button
              className="task-icon-action delete-action"
              onClick={deleteTask}
              aria-label="Delete task"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
            </>
          )}
        </div>
      </div>

      {expanded && !editing && (
        <div className="task-details">
          <p>{task.description || "No description."}</p>
          {!completed && (
            <button className="secondary-button" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
      )}

      {expanded && editing && (
        <form className="edit-form" onSubmit={save}>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
            />
          </label>
          <label>
            Category
            <select
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <div className="button-row">
            <button className="primary-button" type="submit">
              Save
            </button>
            <button className="secondary-button" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </article>
  );
};
