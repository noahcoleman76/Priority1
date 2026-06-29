import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CategoryWithTasksDto, TaskDto } from "@priority1/shared";
import { TaskCard } from "./TaskCard";

type SortableItemProps = {
  task: TaskDto;
  categories: CategoryWithTasksDto[];
  onChanged: (taskId?: string) => Promise<void>;
};

const SortableItem = ({ task, categories, onChanged }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="sortable-item"
    >
      <TaskCard
        task={task}
        categories={categories}
        onChanged={onChanged}
        dragHandle={
          <button className="drag-handle" {...attributes} {...listeners} aria-label="Drag task">
            <GripVertical size={18} />
          </button>
        }
      />
    </div>
  );
};

type Props = {
  tasks: TaskDto[];
  categories: CategoryWithTasksDto[];
  onReorder: (taskIds: string[]) => Promise<void>;
  onChanged: (taskId?: string) => Promise<void>;
};

export const SortableTaskList = ({ tasks, categories, onReorder, onChanged }: Props) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const taskIds = tasks.map((task) => task.id);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = taskIds.indexOf(String(active.id));
    const newIndex = taskIds.indexOf(String(over.id));
    await onReorder(arrayMove(taskIds, oldIndex, newIndex));
  };

  if (tasks.length === 0) {
    return <p className="empty-state">No active tasks here.</p>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {tasks.map((task) => (
            <SortableItem key={task.id} task={task} categories={categories} onChanged={onChanged} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
