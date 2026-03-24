"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ServiceImageItem } from "./types";
import { ImageItem } from "./ImageItem";

type ImageGridProps = {
  items: ServiceImageItem[];
  onReorder: (activeKey: string, overKey: string) => void;
  onRemove: (key: string) => void;
  onSetPrimary: (key: string) => void;
  onMoveUp: (key: string) => void;
  onMoveDown: (key: string) => void;
};

export function ImageGrid({
  items,
  onReorder,
  onRemove,
  onSetPrimary,
  onMoveUp,
  onMoveDown,
}: ImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.key)} strategy={rectSortingStrategy}>
        <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, idx) => (
            <ImageItem
              key={item.key}
              item={item}
              index={idx}
              onRemove={onRemove}
              onSetPrimary={onSetPrimary}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
        </TooltipProvider>
      </SortableContext>
    </DndContext>
  );
}
