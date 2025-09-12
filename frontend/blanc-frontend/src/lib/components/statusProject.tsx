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
  AlertCircleIcon,
  CircleCheckBigIcon,
  PauseCircleIcon,
  TrainTrackIcon,
  XCircleIcon,
} from "lucide-react";
import { fetchProjectById, updateProject } from "@/lib/routes/project";
import clsx from "clsx";

const STATUS_MAP: Record<string, { color: string; icon: JSX.Element | null }> =
  {
    "On Track": {
      color: "bg-purple-500",
      icon: <TrainTrackIcon className="text-white w-3 h-3" />,
    },
    "At Risk": {
      color: "bg-yellow-500",
      icon: <AlertCircleIcon className="text-white w-3 h-3" />,
    },
    "Off Track": {
      color: "bg-red-400",
      icon: <XCircleIcon className="text-white w-3 h-3" />,
    },
    "On Hold": {
      color: "bg-blue-400",
      icon: <PauseCircleIcon className="text-white w-3 h-3" />,
    },
    Done: {
      color: "bg-green-400",
      icon: <CircleCheckBigIcon className="text-white w-3 h-3" />,
    },
  };

interface ProjectStatusProps {
  projectId: number;
}

export default function ProjectStatus({ projectId }: ProjectStatusProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const project = await fetchProjectById(projectId);
        setStatus(project.status ?? null);
      } catch (e) {
        console.error("Failed to fetch project status", e);
        setStatus(null);
      }
    };
    loadStatus();
  }, [projectId]);

  const handleStatusClick = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await updateProject(projectId, { status: newStatus });
    } catch (e) {
      console.error("Failed to update project status", e);

      const project = await fetchProjectById(projectId);
      setStatus(project.status ?? null);
    }
  };

  const current = STATUS_MAP[status ?? ""] ?? {
    color: "bg-gray-200",
    icon: null,
  };

  return (
    <div className="absolute right-4 top-5">
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
          <DropdownMenuLabel>Select Project&apos;s Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(STATUS_MAP).map(([key, { color, icon }]) => (
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
