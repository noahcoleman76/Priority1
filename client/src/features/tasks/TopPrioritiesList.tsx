import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CategoryWithTasksDto } from "@priority1/shared";
import { TaskCard } from "./TaskCard";

type Props = {
  categories: CategoryWithTasksDto[];
  onReorder: (categoryIds: string[]) => Promise<void>;
  onChanged: () => Promise<void>;
};

const TopPriorityItem = ({
  category,
  categories,
  onChanged
}: {
  category: CategoryWithTasksDto;
  categories: CategoryWithTasksDto[];
  onChanged: () => Promise<void>;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const task = category.activeTasks[0];

  if (!task) {
    return null;
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="priority-group"
    >
      <h2>{category.name}</h2>
      <TaskCard
        task={task}
        categories={categories}
        onChanged={onChanged}
        dragHandle={
          <button className="drag-handle" {...attributes} {...listeners} aria-label="Drag category">
            <GripVertical size={18} />
          </button>
        }
      />
    </section>
  );
};

export const TopPrioritiesList = ({ categories, onReorder, onChanged }: Props) => {
  const visibleCategories = categories.filter((category) => category.activeTasks.length > 0);
  const categoryIds = visibleCategories.map((category) => category.id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = categoryIds.indexOf(String(active.id));
    const newIndex = categoryIds.indexOf(String(over.id));
    await onReorder(arrayMove(categoryIds, oldIndex, newIndex));
  };

  if (visibleCategories.length === 0) {
    return <p className="empty-state">Create a task to see your top priorities.</p>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div className="priority-list">
          {visibleCategories.map((category) => (
            <TopPriorityItem
              key={category.id}
              category={category}
              categories={categories}
              onChanged={onChanged}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
