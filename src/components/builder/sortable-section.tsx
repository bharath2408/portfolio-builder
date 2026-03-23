"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import type { SectionWithBlocks } from "@/types";

interface SortableSectionProps {
  section: SectionWithBlocks;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableSection({
  section,
  isActive,
  onSelect,
  onDelete,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "border-primary/30 bg-primary/5"
          : "border-transparent hover:bg-accent",
        isDragging && "z-50 opacity-80 shadow-lg",
      )}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onSelect}
        className="flex-1 text-left truncate"
      >
        <span className="font-medium">{section.name}</span>
      </button>

      <div className="flex items-center opacity-0 group-hover:opacity-100">
        {!section.isVisible && (
          <EyeOff className="mr-1 h-3 w-3 text-muted-foreground" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
