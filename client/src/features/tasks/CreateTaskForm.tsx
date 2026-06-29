import { FormEvent, useState } from "react";
import type { CategoryWithTasksDto } from "@priority1/shared";
import { api } from "../../api/client";

type Props = {
  categories: CategoryWithTasksDto[];
  onSaved: () => Promise<void>;
};

export const CreateTaskForm = ({ categories, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryChoice, setCategoryChoice] = useState(categories[0]?.id ?? "new");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategoryChoice(categories[0]?.id ?? "new");
    setNewCategoryName("");
    setError("");
    setOpen(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await api.createTask({
        title,
        description,
        categoryId: categoryChoice === "new" ? undefined : categoryChoice,
        newCategoryName: categoryChoice === "new" ? newCategoryName : undefined
      });
      reset();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task");
    }
  };

  if (!open) {
    return (
      <button className="create-toggle" onClick={() => setOpen(true)}>
        + Create New Task
      </button>
    );
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <label>
        Task Name
        <input value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
      </label>
      <label>
        Task Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
      </label>
      <label>
        Category
        <select value={categoryChoice} onChange={(event) => setCategoryChoice(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value="new">Create New Category</option>
        </select>
      </label>
      {categoryChoice === "new" && (
        <label>
          New category name
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            required
          />
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <div className="button-row">
        <button className="primary-button" type="submit">
          Save
        </button>
        <button className="secondary-button" type="button" onClick={reset}>
          Cancel
        </button>
      </div>
    </form>
  );
};
