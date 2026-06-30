import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Pencil, X } from "lucide-react";
import type { CategoryWithTasksDto } from "@priority1/shared";
import { Header } from "../../components/Header";
import { api } from "../../api/client";
import { CreateTaskForm } from "./CreateTaskForm";
import { CompletedTasks } from "./CompletedTasks";
import { SortableTaskList } from "./SortableTaskList";
import { TopPrioritiesList } from "./TopPrioritiesList";
import { useAppData } from "./useAppData";

const TOP_PRIORITIES = "top";

type CategoryBubbleProps = {
  category: CategoryWithTasksDto;
  selected: boolean;
  onSelect: () => void;
};

const SortableCategoryBubble = ({ category, selected, onSelect }: CategoryBubbleProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="category-bubble"
      onClick={onSelect}
      {...attributes}
      {...listeners}
      aria-pressed={selected}
    >
      {category.name}
    </button>
  );
};

export const AppLayout = () => {
  const { data, setData, loading, error, refresh } = useAppData();
  const [selectedCategoryId, setSelectedCategoryId] = useState(TOP_PRIORITIES);
  const [editingCategoryName, setEditingCategoryName] = useState(false);
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [categoryNameError, setCategoryNameError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");
  const [confirmingCategoryDelete, setConfirmingCategoryDelete] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState("");
  const categorySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const categoryIds = data.categories.map((category) => category.id);
    const oldIndex = categoryIds.indexOf(String(active.id));
    const newIndex = categoryIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    await reorderCategories(arrayMove(categoryIds, oldIndex, newIndex));
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

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setNewCategoryError("Category name is required");
      return;
    }

    setNewCategoryError("");
    try {
      const result = await api.createCategory(name);
      setNewCategoryName("");
      setCreatingCategory(false);
      setSelectedCategoryId(result.category.id);
      await refresh();
    } catch (err) {
      setNewCategoryError(err instanceof Error ? err.message : "Unable to create category");
    }
  };

  const cancelCategoryCreate = () => {
    setCreatingCategory(false);
    setNewCategoryName("");
    setNewCategoryError("");
  };

  const deleteSelectedCategory = async () => {
    if (!selectedCategory) {
      return;
    }

    if (selectedCategory.activeTasks.length > 0) {
      setCategoryDeleteError("Complete or delete all active tasks before deleting this category");
      return;
    }

    if (!confirmingCategoryDelete) {
      setConfirmingCategoryDelete(true);
      setCategoryDeleteError("");
      return;
    }

    try {
      await api.deleteCategory(selectedCategory.id);
      setSelectedCategoryId(TOP_PRIORITIES);
      setConfirmingCategoryDelete(false);
      setCategoryDeleteError("");
      await refresh();
    } catch (err) {
      setCategoryDeleteError(err instanceof Error ? err.message : "Unable to delete category");
    }
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingCategoryName(false);
    setCategoryNameError("");
    setConfirmingCategoryDelete(false);
    setCategoryDeleteError("");
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
            onClick={() => selectCategory(TOP_PRIORITIES)}
          >
            Top Priorities
          </button>
          <DndContext sensors={categorySensors} onDragEnd={handleCategoryDragEnd}>
            <SortableContext
              items={data.categories.map((category) => category.id)}
              strategy={horizontalListSortingStrategy}
            >
              {data.categories.map((category) => (
                <SortableCategoryBubble
                  key={category.id}
                  category={category}
                  selected={selectedCategoryId === category.id}
                  onSelect={() => selectCategory(category.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {creatingCategory ? (
            <span className="category-create-inline">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void createCategory();
                  }
                  if (event.key === "Escape") {
                    cancelCategoryCreate();
                  }
                }}
                aria-label="New category name"
                placeholder="Category name"
                autoFocus
              />
              <button
                className="task-icon-action complete-action"
                onClick={createCategory}
                aria-label="Create category"
                title="Create category"
              >
                <Check size={16} />
              </button>
              <button
                className="task-icon-action"
                onClick={cancelCategoryCreate}
                aria-label="Cancel category creation"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </span>
          ) : (
            <button
              className="category-bubble category-bubble-plus"
              onClick={() => setCreatingCategory(true)}
              aria-label="Create category"
              title="Create category"
            >
              +
            </button>
          )}
        </div>
        {newCategoryError && <p className="error">{newCategoryError}</p>}

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
              <div className="category-management-row">
                {selectedCategory.activeTasks.length > 0 ? (
                  <p className="muted">
                    Complete or delete all active tasks before deleting this category.
                  </p>
                ) : (
                  <div className="delete-confirm">
                    <button className="confirm-delete-button" onClick={deleteSelectedCategory}>
                      {confirmingCategoryDelete ? "Delete category?" : "Delete category"}
                    </button>
                    {confirmingCategoryDelete && (
                      <button
                        className="cancel-delete-button"
                        onClick={() => setConfirmingCategoryDelete(false)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {categoryDeleteError && <p className="error">{categoryDeleteError}</p>}
              </div>
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
