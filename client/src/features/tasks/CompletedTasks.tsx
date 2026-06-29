import { useState } from "react";
import type { CategoryWithTasksDto } from "@priority1/shared";
import { TaskCard } from "./TaskCard";

type Props = {
  category: CategoryWithTasksDto;
  categories: CategoryWithTasksDto[];
  onChanged: (taskId?: string) => Promise<void>;
};

export const CompletedTasks = ({ category, categories, onChanged }: Props) => {
  const [open, setOpen] = useState(false);
  const completed = [...category.completedTasks].sort((a, b) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
  );

  return (
    <section className="completed-section">
      <button className="completed-toggle" onClick={() => setOpen((value) => !value)}>
        Show Completed Tasks ({completed.length})
      </button>
      {open && (
        <div className="task-list completed-list">
          {completed.length === 0 ? (
            <p className="empty-state">No completed tasks.</p>
          ) : (
            completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categories={categories}
                onChanged={onChanged}
                completed
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};
