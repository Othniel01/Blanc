"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCorners, // Changed for better performance
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
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
import { fetchTasksWithDetails } from "@/lib/routes/task";
import { useUpdateTaskStage } from "@/lib/hooks/use_task";

interface Props {
  projectId: number;
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<"task" | "stage" | null>(null);
  const { mutate: updateTaskStage } = useUpdateTaskStage(projectId);

  React.useEffect(() => {
    if (!projectId) return;

    fetchTasksWithDetails(projectId)
      .then((fetchedTasks) => setTasks(fetchedTasks))
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const idStr = String(event.active.id);
    if (idStr.startsWith("task-")) {
      setActiveId(Number(idStr.replace("task-", "")));
      setActiveType("task");
    } else if (idStr.startsWith("stage-")) {
      setActiveId(Number(idStr.replace("stage-", "")));
      setActiveType("stage");
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.data.current?.type !== "task") return;

      const activeTaskId = Number(String(active.id).replace("task-", ""));
      const activeTask = tasks.find((t) => t.id === activeTaskId);
      if (!activeTask) return;

      let newstage_id: number | null = null;
      const overIdStr = String(over.id);

      if (overIdStr.startsWith("stage-")) {
        newstage_id = Number(overIdStr.replace("stage-", ""));
      } else if (overIdStr.startsWith("task-")) {
        const overTaskId = Number(overIdStr.replace("task-", ""));
        const overTask = tasks.find((t) => t.id === overTaskId);
        if (overTask) newstage_id = overTask.stage_id;
      }

      if (newstage_id === null || activeTask.stage_id === newstage_id) return;

      // Update tasks state to move task to new stage
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === activeTaskId ? { ...t, stage_id: newstage_id! } : t
        )
      );
    },
    [tasks]
  );

  // Memoize tasksByStage for render and drag operations
  const tasksByStage = useMemo(() => {
    const result: Record<number, Task[]> = {};
    stages.forEach((stage) => {
      result[stage.id] = tasks.filter((t) => t.stage_id === stage.id);
    });
    return result;
  }, [tasks, stages]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveType(null);

      if (!over) return;

      // Handle dragging stages
      if (active.data.current?.type === "stage") {
        const activestage_id = Number(String(active.id).replace("stage-", ""));
        const overstage_id = Number(String(over.id).replace("stage-", ""));

        const oldIndex = stages.findIndex((s) => s.id === activestage_id);
        const newIndex = stages.findIndex((s) => s.id === overstage_id);

        if (oldIndex !== newIndex) {
          const newStages: Stage[] = arrayMove(stages, oldIndex, newIndex).map(
            (s, i) => ({ ...s, sequence: i + 1 })
          );

          // Optimistic update
          queryClient.setQueryData(["stages", projectId], newStages);

          // Batch mutations
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

        const activestage_id = activeTask.stage_id;
        let newstage_id = activestage_id;
        let isOverStage = false;
        let overTaskId: number | null = null;

        if (over.data.current?.type === "task") {
          overTaskId = Number(String(over.id).replace("task-", ""));
          newstage_id = over.data.current.stage_id;
        } else if (over.data.current?.type === "stage") {
          newstage_id = over.data.current.stage_id;
          isOverStage = true;
        } else {
          return;
        }

        if (activeTaskId === overTaskId && activestage_id === newstage_id)
          return;

        // Update tasks array incrementally
        setTasks((prevTasks) => {
          // Remove task from current position
          const updatedTasks = prevTasks.filter((t) => t.id !== activeTaskId);
          const newTask = { ...activeTask, stage_id: newstage_id };

          // Find insertion index in new stage
          const tasksInStage = tasksByStage[newstage_id] || [];

          const newIndex = isOverStage
            ? tasksInStage.length
            : tasksInStage.findIndex((t) => t.id === overTaskId) +
              (event.delta.y > 0 ? 1 : 0);

          // Find global index to insert
          let globalIndex = 0;
          for (const stage of stages) {
            if (stage.id === newstage_id) {
              globalIndex += newIndex;
              break;
            }
            globalIndex += tasksByStage[stage.id]?.length || 0; // fallback here too
          }

          // Insert task at global index
          return [
            ...updatedTasks.slice(0, globalIndex),
            newTask,
            ...updatedTasks.slice(globalIndex),
          ];
        });

        updateTaskStage({ taskId: activeTaskId, stage_id: newstage_id });

        // TODO: Implement useTasks hook with updateTask
        // updateTask.mutate({ id: activeTaskId, stage_id: newstage_id });
      }
    },
    [
      stages,
      queryClient,
      projectId,
      updateStage,
      tasks,
      updateTaskStage,
      tasksByStage,
    ]
  );

  // Memoize active items for DragOverlay
  const activeStage = useMemo(
    () =>
      activeType === "stage" && activeId !== null
        ? stages.find((s) => s.id === activeId)
        : null,
    [activeType, activeId, stages]
  );

  const activeTask = useMemo(
    () =>
      activeType === "task" && activeId !== null
        ? tasks.find((t) => t.id === activeId)
        : null,
    [activeType, activeId, tasks]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners} // Changed for performance
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
              tasks={tasksByStage[stage.id] || []} // Use memoized tasks
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeStage && (
          <div
            className="flex flex-col gap-3"
            style={{
              minWidth: "320px",
              width: "320px",
              opacity: 0.8,
              transform: "scale(1.02)",
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
                  {tasksByStage[activeStage.id]?.length || 0}
                </Badge>
                <MoreVerticalIcon className="w-4 h-4" />
              </div>
            </div>
            {/* Render minimal task list to reduce overhead */}
            <div className="bg-gray-200 p-2 rounded-sm min-h-[50px]" />
          </div>
        )}
        {activeTask && (
          <TaskCard
            task={activeTask}
            stage_id={activeTask.stage_id}
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
