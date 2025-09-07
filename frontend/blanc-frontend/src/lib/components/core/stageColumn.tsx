import React from "react";
import { Stage, Task } from "../../data/data";
import { useDroppable } from "@dnd-kit/core"; // Simplified imports
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "@/lib/components/core/taskCard";
import { Badge } from "@/lib/components/ui/badge";
import { PlusCircleIcon, MoreVerticalIcon, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";

interface Props {
  stage: Stage;
  tasks: Task[];
}

export default function StageColumn({ stage, tasks }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `stage-${stage.id}`,
    data: { type: "stage", stageId: stage.id },
  });

  const { setNodeRef: dropRef } = useDroppable({
    id: stage.id,
    data: { type: "stage", stageId: stage.id },
  });

  const wrapperStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease, opacity 200ms ease", // Smooth transition
    minWidth: "320px",
    width: "320px",
    opacity: isDragging ? 0.6 : 1, // Softer opacity for dragging
    zIndex: isDragging ? 10 : 1, // Ensure dragged stage is above others
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      {...attributes}
      className="flex flex-col gap-3 touch-none" // Prevent touch issues on mobile
    >
      {/* Stage header */}
      <div className="flex justify-between items-center  p-2 ">
        <div className="flex items-center gap-2">
          <GripVertical
            className="w-4 h-4 cursor-grab touch-none"
            {...listeners}
          />
          <h2 className="font-medium text-sm">{stage.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            {tasks.length}
          </Badge>
          <MoreVerticalIcon className="w-4 h-4 cursor-pointer" />
        </div>
      </div>

      {/* Add task button */}
      <div className="bg-white border rounded-sm flex justify-center items-center gap-2 text-xs h-10 w-full transition-colors hover:bg-gray-50">
        <PlusCircleIcon className="w-4 h-4" /> Add New task
      </div>

      {/* Task list */}
      <div
        ref={dropRef}
        className="rounded-sm flex flex-col gap-2 min-h-[50px] transition-all duration-200 ease-in-out"
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} stageId={stage.id} />
        ))}
      </div>
    </div>
  );
}
