"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCorners,
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
import { Task } from "../../data/data";
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
  const queryClient = useQueryClient();
  const { stagesQuery, updateStage } = useStages(projectId);
  const stages: Stage[] = stagesQuery.data ?? [];
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<"task" | "stage" | null>(null);
  const { mutate: updateTaskStage } = useUpdateTaskStage(projectId);

  // Fetch tasks with react-query
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasksWithDetails(projectId),
    enabled: !!projectId, // Only fetch if projectId is provided
  });

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

      let newStageId: number | null = null;
      const overIdStr = String(over.id);

      if (overIdStr.startsWith("stage-")) {
        newStageId = Number(overIdStr.replace("stage-", ""));
      } else if (overIdStr.startsWith("task-")) {
        const overTaskId = Number(overIdStr.replace("task-", ""));
        const overTask = tasks.find((t) => t.id === overTaskId);
        if (overTask) newStageId = overTask.stage_id;
      }

      if (newStageId === null || activeTask.stage_id === newStageId) return;

      // Optimistically update the cache
      queryClient.setQueryData(
        ["tasks", projectId],
        (old: Task[] | undefined) =>
          old?.map((t) =>
            t.id === activeTaskId ? { ...t, stage_id: newStageId! } : t
          )
      );
    },
    [tasks, queryClient, projectId]
  );

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

      if (active.data.current?.type === "stage") {
        const activeStageId = Number(String(active.id).replace("stage-", ""));
        const overStageId = Number(String(over.id).replace("stage-", ""));

        const oldIndex = stages.findIndex((s) => s.id === activeStageId);
        const newIndex = stages.findIndex((s) => s.id === overStageId);

        if (oldIndex !== newIndex) {
          const newStages: Stage[] = arrayMove(stages, oldIndex, newIndex).map(
            (s, i) => ({ ...s, sequence: i + 1 })
          );

          queryClient.setQueryData(["stages", projectId], newStages);

          newStages.forEach((s) =>
            updateStage.mutate({ id: s.id, sequence: s.sequence })
          );
        }
        return;
      }

      if (active.data.current?.type === "task") {
        const activeTaskId = Number(String(active.id).replace("task-", ""));
        const activeTask = tasks.find((t) => t.id === activeTaskId);
        if (!activeTask) return;

        const activeStageId = activeTask.stage_id;
        let newStageId = activeStageId;
        let isOverStage = false;
        let overTaskId: number | null = null;

        if (over.data.current?.type === "task") {
          overTaskId = Number(String(over.id).replace("task-", ""));
          newStageId = over.data.current.stage_id;
        } else if (over.data.current?.type === "stage") {
          newStageId = over.data.current.stage_id;
          isOverStage = true;
        } else {
          return;
        }

        if (activeTaskId === overTaskId && activeStageId === newStageId) return;

        // Optimistically update the cache
        queryClient.setQueryData(
          ["tasks", projectId],
          (old: Task[] | undefined) => {
            if (!old) return old;
            const updatedTasks = old.filter((t) => t.id !== activeTaskId);
            const newTask = { ...activeTask, stage_id: newStageId };

            const tasksInStage = tasksByStage[newStageId] || [];
            const newIndex = isOverStage
              ? tasksInStage.length
              : tasksInStage.findIndex((t) => t.id === overTaskId) +
                (event.delta.y > 0 ? 1 : 0);

            let globalIndex = 0;
            for (const stage of stages) {
              if (stage.id === newStageId) {
                globalIndex += newIndex;
                break;
              }
              globalIndex += tasksByStage[stage.id]?.length || 0;
            }

            return [
              ...updatedTasks.slice(0, globalIndex),
              newTask,
              ...updatedTasks.slice(globalIndex),
            ];
          }
        );

        // Sync with server
        updateTaskStage({ taskId: activeTaskId, stage_id: newStageId });
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 w-full h-full p-4 bg-[#f5f6f8] overflow-x-auto">
        <SortableContext
          items={stages.map((s) => `stage-${s.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {isLoading
            ? // Skeleton loading for stages
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skeleton-stage-${i}`}
                  className="flex flex-col gap-3 min-w-[320px] p-2"
                >
                  <div className="flex justify-between items-center bg-gray-100 rounded-sm p-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-300 rounded" />
                      <div className="w-20 h-4 bg-gray-300 rounded" />
                    </div>
                    <div className="w-4 h-4 bg-gray-300 rounded" />
                  </div>
                  <div className="bg-gray-200 p-2 rounded-sm min-h-[50px]">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div
                        key={`skeleton-task-${j}`}
                        className="bg-white p-2 mb-2 rounded shadow"
                      >
                        <div className="w-full h-4 bg-gray-300 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  tasks={tasksByStage[stage.id] || []}
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
