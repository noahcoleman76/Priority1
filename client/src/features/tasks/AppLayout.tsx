import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Header } from "../../components/Header";
import { api } from "../../api/client";
import { CreateTaskForm } from "./CreateTaskForm";
import { CompletedTasks } from "./CompletedTasks";
import { SortableTaskList } from "./SortableTaskList";
import { TopPrioritiesList } from "./TopPrioritiesList";
import { useAppData } from "./useAppData";

const TOP_PRIORITIES = "top";

export const AppLayout = () => {
  const { data, setData, loading, error, refresh } = useAppData();
  const [selectedCategoryId, setSelectedCategoryId] = useState(TOP_PRIORITIES);
  const [editingCategoryName, setEditingCategoryName] = useState(false);
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [categoryNameError, setCategoryNameError] = useState("");

  const selectedCategory = useMemo(
    () => data.categories.find((category) => category.id === selectedCategoryId),
    [data.categories, selectedCategoryId]
  );

  const reorderTasks = async (categoryId: string, taskIds: string[]) => {
    const previous = data;
    setData({
      categories: data.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              activeTasks: taskIds
                .map((id) => category.activeTasks.find((task) => task.id === id))
                .filter(Boolean) as typeof category.activeTasks
            }
          : category
      )
    });
    try {
      await api.reorderTasks(categoryId, taskIds);
      await refresh();
    } catch {
      setData(previous);
    }
  };

  const reorderCategories = async (categoryIds: string[]) => {
    const previous = data;
    const ordered = categoryIds
      .map((id) => data.categories.find((category) => category.id === id))
      .filter(Boolean) as typeof data.categories;
    const omitted = data.categories.filter((category) => !categoryIds.includes(category.id));
    setData({ categories: [...ordered, ...omitted] });
    try {
      await api.reorderCategories(categoryIds);
      await refresh();
    } catch {
      setData(previous);
    }
  };

  const refreshAfterTaskChange = async (taskId?: string) => {
    if (taskId) {
      setData((current) => ({
        categories: current.categories.map((category) => ({
          ...category,
          activeTasks: category.activeTasks.filter((task) => task.id !== taskId),
          completedTasks: category.completedTasks.filter((task) => task.id !== taskId)
        }))
      }));
    }
    await refresh();
  };

  const startCategoryRename = () => {
    if (!selectedCategory) {
      return;
    }
    setCategoryNameDraft(selectedCategory.name);
    setCategoryNameError("");
    setEditingCategoryName(true);
  };

  const cancelCategoryRename = () => {
    setEditingCategoryName(false);
    setCategoryNameError("");
  };

  const saveCategoryName = async () => {
    if (!selectedCategory) {
      return;
    }

    const name = categoryNameDraft.trim();
    if (!name) {
      setCategoryNameError("Category name is required");
      return;
    }

    setCategoryNameError("");
    try {
      await api.updateCategory(selectedCategory.id, { name });
      setEditingCategoryName(false);
      await refresh();
    } catch (err) {
      setCategoryNameError(err instanceof Error ? err.message : "Unable to rename category");
    }
  };

  return (
    <>
      <Header />
      <main className="page-shell">
        <CreateTaskForm categories={data.categories} onSaved={refresh} />

        <div className="category-bubbles" aria-label="Category views">
          <button
            className="category-bubble category-bubble-top"
            aria-pressed={selectedCategoryId === TOP_PRIORITIES}
            onClick={() => setSelectedCategoryId(TOP_PRIORITIES)}
          >
            Top Priorities
          </button>
          {data.categories.map((category) => (
            <button
              key={category.id}
              className="category-bubble"
              aria-pressed={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {loading && <p className="empty-state">Loading tasks...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && selectedCategoryId === TOP_PRIORITIES && (
          <section className="task-view-panel">
            <div className="task-view-header">
              <h1>Top Priorities</h1>
            </div>
            <TopPrioritiesList
              categories={data.categories}
              onReorder={reorderCategories}
              onChanged={refreshAfterTaskChange}
            />
          </section>
        )}

        {!loading && selectedCategoryId !== TOP_PRIORITIES && selectedCategory && (
          <section className="task-view-panel">
            <div className="task-view-header">
              {editingCategoryName ? (
                <div className="category-title-edit">
                  <label className="sr-only" htmlFor="category-name">
                    Category name
                  </label>
                  <input
                    id="category-name"
                    value={categoryNameDraft}
                    onChange={(event) => setCategoryNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void saveCategoryName();
                      }
                      if (event.key === "Escape") {
                        cancelCategoryRename();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="task-icon-action complete-action"
                    onClick={saveCategoryName}
                    aria-label="Save category name"
                    title="Save category name"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="task-icon-action"
                    onClick={cancelCategoryRename}
                    aria-label="Cancel category rename"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="category-title-row">
                  <h1>{selectedCategory.name}</h1>
                  <button
                    className="task-icon-action"
                    onClick={startCategoryRename}
                    aria-label="Edit category name"
                    title="Edit category name"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
              {categoryNameError && <p className="error">{categoryNameError}</p>}
            </div>
            <SortableTaskList
              tasks={selectedCategory.activeTasks}
              categories={data.categories}
              onChanged={refreshAfterTaskChange}
              onReorder={(taskIds) => reorderTasks(selectedCategory.id, taskIds)}
            />
            <CompletedTasks
              category={selectedCategory}
              categories={data.categories}
              onChanged={refreshAfterTaskChange}
            />
          </section>
        )}
      </main>
    </>
  );
};
