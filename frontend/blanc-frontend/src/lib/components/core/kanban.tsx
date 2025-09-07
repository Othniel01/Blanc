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
import { Task, tasks as initialTasks } from "../../data/data";
import { useQueryClient } from "@tanstack/react-query";
import StageColumn from "@/lib/components/core/stageColumn";
import TaskCard from "@/lib/components/core/taskCard";
import { Badge, GripVertical, MoreVerticalIcon } from "lucide-react";

import { useStages } from "@/lib/routes/stages";

interface Props {
  projectId: number; // ⬅️ make projectId dynamic via props
}

export interface Stage {
  id: number;
  name: string;
  sequence: number;
  projectId: number;
}

export default function Kanban({ projectId }: Props) {
  const { stagesQuery, updateStage } = useStages(projectId);
  const stages: Stage[] = stagesQuery.data ?? [];
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<Task[]>([...initialTasks]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<"task" | "stage" | null>(null); // Added to distinguish type

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const idStr = String(event.active.id);
    if (idStr.startsWith("task-")) {
      setActiveId(Number(idStr.replace("task-", "")));
      setActiveType("task");
    } else if (idStr.startsWith("stage-")) {
      setActiveId(Number(idStr.replace("stage-", "")));
      setActiveType("stage");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    // Handle dragging stages
    if (active.data.current?.type === "stage") {
      const activeStageId = Number(String(active.id).replace("stage-", ""));
      const overStageId = Number(String(over.id).replace("stage-", ""));

      const oldIndex = stages.findIndex((s) => s.id === activeStageId);
      const newIndex = stages.findIndex((s) => s.id === overStageId);

      if (oldIndex !== newIndex) {
        const newStages: Stage[] = arrayMove(stages, oldIndex, newIndex).map(
          (s, i) => ({ ...s, sequence: i + 1 })
        );

        // ✅ Optimistic update
        queryClient.setQueryData(["stages", projectId], newStages);

        // ✅ Persist
        newStages.forEach((s) =>
          updateStage.mutate({ id: s.id, sequence: s.sequence })
        );
      }
      return;
    }

    // Handle dragging tasks
    if (active.data.current?.type === "task") {
      const activeTaskId = Number(String(active.id).replace("task-", ""));
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      const activeStageId = activeTask.stageId;
      let newStageId = activeStageId;
      let isOverStage = false;
      let overTaskId: number | null = null;

      if (over.data.current?.type === "task") {
        overTaskId = Number(String(over.id).replace("task-", ""));
        newStageId = over.data.current.stageId;
      } else if (over.data.current?.type === "stage") {
        newStageId = over.data.current.stageId; // Assumes data.stageId set in StageColumn
        isOverStage = true;
      } else {
        return;
      }

      if (activeTaskId === overTaskId && activeStageId === newStageId) return;

      // Compute tasksByStage based on current order
      const tasksByStage: Record<number, Task[]> = {};
      stages.forEach((stage) => {
        tasksByStage[stage.id] = tasks.filter((t) => t.stageId === stage.id);
      });

      // Remove active task from original stage
      tasksByStage[activeStageId] = tasksByStage[activeStageId].filter(
        (t) => t.id !== activeTaskId
      );

      // Create updated task
      const newTask = { ...activeTask, stageId: newStageId };

      // Calculate insertion index
      let newIndex;
      if (isOverStage) {
        newIndex = tasksByStage[newStageId].length;
      } else {
        const overIndex = tasksByStage[newStageId].findIndex(
          (t) => t.id === overTaskId
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
  const activeStage =
    activeType === "stage" && activeId !== null
      ? stages.find((s) => s.id === activeId)
      : null;
  const activeTask =
    activeType === "task" && activeId !== null
      ? tasks.find((t) => t.id === activeId)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 w-full h-full p-4 bg-[#f5f6f8] overflow-x-auto">
        <SortableContext
          items={stages.map((s) => `stage-${s.id}`)}
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
