"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Stage,
  Task,
  stages as initialStages,
  tasks as initialTasks,
} from "../../data/data";
import StageColumn from "@/lib/components/core/stageColumn";
import TaskCard from "@/lib/components/core/taskCard";
import { Badge, GripVertical, MoreVerticalIcon } from "lucide-react";

export default function Kanban() {
  const [stages, setStages] = useState<Stage[]>(
    [...initialStages].sort((a, b) => a.sequence - b.sequence)
  );
  const [tasks, setTasks] = useState<Task[]>([...initialTasks]);
  const [activeId, setActiveId] = useState<string | null>(null); // Track dragged item

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString()); // Ensure string
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); // Clear active drag

    if (!over) return;

    // Handle dragging stages
    if (active.data.current?.type === "stage") {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);
      const newStages = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
        ...s,
        sequence: i + 1,
      }));
      setStages(newStages);
      return;
    }

    // Handle dragging tasks
    if (active.data.current?.type === "task") {
      const activeId = active.id;
      const overId = over.id;
      const activeTask = tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      const activeStageId = activeTask.stageId;
      let newStageId = activeStageId;
      let isOverStage = false;

      if (over.data.current?.type === "task") {
        newStageId = over.data.current.stageId;
      } else if (over.data.current?.type === "stage") {
        newStageId = over.data.current.stageId;
        isOverStage = true;
      } else {
        return;
      }

      if (activeId === overId && activeStageId === newStageId) return;

      // Compute tasksByStage based on current order
      const tasksByStage: Record<string, Task[]> = {};
      stages.forEach((stage) => {
        tasksByStage[stage.id] = tasks.filter((t) => t.stageId === stage.id);
      });

      // Remove active task from original stage
      tasksByStage[activeStageId] = tasksByStage[activeStageId].filter(
        (t) => t.id !== activeId
      );

      // Create updated task
      const newTask = { ...activeTask, stageId: newStageId };

      // Calculate insertion index
      let newIndex;
      if (isOverStage) {
        newIndex = tasksByStage[newStageId].length;
      } else {
        const overIndex = tasksByStage[newStageId].findIndex(
          (t) => t.id === overId
        );
        const isBelow = event.delta.y > 0;
        newIndex = overIndex + (isBelow ? 1 : 0);
      }

      // Insert into new stage
      tasksByStage[newStageId] = [
        ...tasksByStage[newStageId].slice(0, newIndex),
        newTask,
        ...tasksByStage[newStageId].slice(newIndex),
      ];

      // Reconstruct flat tasks array
      const newTasks = stages.flatMap((stage) => tasksByStage[stage.id] || []);
      setTasks(newTasks);
    }
  };

  // Find the dragged item for DragOverlay
  const activeStage = activeId ? stages.find((s) => s.id === activeId) : null;
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 w-full h-full p-4 bg-[#f5f6f8] overflow-x-auto">
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              tasks={tasks.filter((t) => t.stageId === stage.id)}
            />
          ))}
        </SortableContext>
      </div>
      {/* Drag Overlay for smooth dragging visuals */}
      <DragOverlay dropAnimation={null}>
        {activeStage && (
          <div
            className="flex flex-col gap-3"
            style={{
              minWidth: "320px",
              width: "320px",
              opacity: 0.8,
              transform: "scale(1.02)", // Slight scale for visual pop
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div className="flex justify-between items-center bg-gray-100 rounded-sm p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                <h2 className="font-medium text-sm">{activeStage.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-xs">
                  {tasks.filter((t) => t.stageId === activeStage.id).length}
                </Badge>
                <MoreVerticalIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-gray-200 p-2 rounded-sm flex flex-col gap-2 min-h-[50px]">
              {tasks
                .filter((t) => t.stageId === activeStage.id)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    stageId={activeStage.id}
                    isDragging={!!activeId}
                  />
                ))}
            </div>
          </div>
        )}
        {activeTask && (
          <TaskCard
            task={activeTask}
            stageId={activeTask.stageId}
            style={{
              opacity: 0.8,
              transform: "scale(1.02)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
