import { useMemo, useState } from "react";
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

  return (
    <>
      <Header />
      <main className="page-shell">
        <CreateTaskForm categories={data.categories} onSaved={refresh} />

        <div className="view-controls">
          <label>
            View
            <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
              <option value={TOP_PRIORITIES}>Top Priorities</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p className="empty-state">Loading tasks...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && selectedCategoryId === TOP_PRIORITIES && (
          <>
            <h1>Top Priorities</h1>
            <TopPrioritiesList categories={data.categories} onReorder={reorderCategories} onChanged={refresh} />
          </>
        )}

        {!loading && selectedCategoryId !== TOP_PRIORITIES && selectedCategory && (
          <>
            <h1>{selectedCategory.name}</h1>
            <SortableTaskList
              tasks={selectedCategory.activeTasks}
              categories={data.categories}
              onChanged={refresh}
              onReorder={(taskIds) => reorderTasks(selectedCategory.id, taskIds)}
            />
            <CompletedTasks category={selectedCategory} categories={data.categories} onChanged={refresh} />
          </>
        )}
      </main>
    </>
  );
};
