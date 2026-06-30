import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CategoryWithTasksDto } from "@priority1/shared";
import { Check, ChevronDown } from "lucide-react";
import { api } from "../../api/client";
import { RecurrenceFields, RecurrenceFormValue } from "./RecurrenceFields";

type Props = {
  categories: CategoryWithTasksDto[];
  onSaved: () => Promise<void>;
};

export const CreateTaskForm = ({ categories, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryChoice, setCategoryChoice] = useState(categories[0]?.id ?? "new");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceFormValue>({
    recurrenceType: null,
    recurrenceDays: []
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const selectedCategoryLabel = useMemo(() => {
    if (categoryChoice === "new") {
      return "Create New Category";
    }
    return categories.find((category) => category.id === categoryChoice)?.name ?? "Choose category";
  }, [categories, categoryChoice]);

  useEffect(() => {
    if (!open && categories[0]) {
      setCategoryChoice(categories[0].id);
      return;
    }

    if (
      open &&
      categories[0] &&
      categoryChoice !== "new" &&
      !categories.some((category) => category.id === categoryChoice)
    ) {
      setCategoryChoice(categories[0].id);
    }
  }, [categories, categoryChoice, open]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategoryChoice(categories[0]?.id ?? "new");
    setCategoryMenuOpen(false);
    setRecurrence({ recurrenceType: null, recurrenceDays: [] });
    setNewCategoryName("");
    setError("");
    setOpen(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (recurrence.recurrenceType === "custom" && recurrence.recurrenceDays.length === 0) {
      setError("Choose at least one custom recurrence day");
      return;
    }
    try {
      await api.createTask({
        title,
        description,
        categoryId: categoryChoice === "new" ? undefined : categoryChoice,
        newCategoryName: categoryChoice === "new" ? newCategoryName : undefined,
        recurrenceType: recurrence.recurrenceType,
        recurrenceDays: recurrence.recurrenceDays
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
      <RecurrenceFields value={recurrence} onChange={setRecurrence} />
      <label>
        <span>Category</span>
        <div className="category-select">
          <button
            className="category-select-trigger"
            type="button"
            onClick={() => setCategoryMenuOpen((value) => !value)}
            aria-expanded={categoryMenuOpen}
            aria-haspopup="listbox"
          >
            <span>{selectedCategoryLabel}</span>
            <ChevronDown size={18} />
          </button>
          {categoryMenuOpen && (
            <div className="category-select-menu" role="listbox">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-select-option"
                  type="button"
                  role="option"
                  aria-selected={categoryChoice === category.id}
                  onClick={() => {
                    setCategoryChoice(category.id);
                    setCategoryMenuOpen(false);
                  }}
                >
                  <span>{category.name}</span>
                  {categoryChoice === category.id && <Check size={16} />}
                </button>
              ))}
              <button
                className="category-select-option category-select-new"
                type="button"
                role="option"
                aria-selected={categoryChoice === "new"}
                onClick={() => {
                  setCategoryChoice("new");
                  setCategoryMenuOpen(false);
                }}
              >
                <span>Create New Category</span>
                {categoryChoice === "new" && <Check size={16} />}
              </button>
            </div>
          )}
        </div>
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
