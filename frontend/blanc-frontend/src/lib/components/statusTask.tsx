"use client";

import React, { JSX, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  Loader2Icon,
  CircleCheckBigIcon,
  XCircleIcon,
  FileEditIcon,
  PauseCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import clsx from "clsx";
import { fetchTaskById, updateTask } from "@/lib/routes/task";

// Map task statuses to colors + icons
const TASK_STATUS_MAP: Record<
  string,
  { color: string; icon: JSX.Element | null }
> = {
  "In Progress": {
    color: "bg-blue-500",
    icon: <Loader2Icon className="text-white w-3 h-3" />,
  },
  "Changes Requested": {
    color: "bg-yellow-500",
    icon: <FileEditIcon className="text-white w-3 h-3" />,
  },
  Approved: {
    color: "bg-purple-500",
    icon: <CheckCircle2Icon className="text-white w-3 h-3" />,
  },
  Cancelled: {
    color: "bg-red-500",
    icon: <XCircleIcon className="text-white w-3 h-3" />,
  },
  Done: {
    color: "bg-green-500",
    icon: <CircleCheckBigIcon className="text-white w-3 h-3" />,
  },
};

interface TaskStatusProps {
  taskId: number;
  projectId: number;
}

export default function TaskStatus({ taskId, projectId }: TaskStatusProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const task = await fetchTaskById(taskId, projectId);
        setStatus(task.status ?? null);
      } catch (e) {
        console.error("Failed to fetch task status", e);
        setStatus(null);
      }
    };
    loadStatus();
  }, [taskId]);

  const handleStatusClick = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (e) {
      console.error("Failed to update task status", e);
      // revert to server state
      const task = await fetchTaskById(taskId, projectId);
      setStatus(task.status ?? null);
    }
  };

  const current = TASK_STATUS_MAP[status ?? ""] ?? {
    color: "bg-gray-200",
    icon: null,
  };

  return (
    <div className="">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div
            className={clsx(
              "border rounded-full border-sidebar-border h-10 w-10 flex items-center justify-center",
              current.color
            )}
          >
            {current.icon &&
              React.cloneElement(current.icon, {
                className: "text-white w-6 h-6",
              })}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuLabel>Select Task&apos;s Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(TASK_STATUS_MAP).map(([key, { color, icon }]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusClick(key)}
              className="flex items-center gap-2"
            >
              <div
                className={clsx(
                  "border rounded-full border-sidebar-border h-6 w-6 flex items-center justify-center",
                  color
                )}
              >
                {icon}
              </div>
              {key}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
