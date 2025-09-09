// components/tasks/AssignedUsersTable.tsx
"use client";

import React from "react";
import {
  useTaskAssignees,
  useUnassignTaskUser,
} from "@/lib/hooks/use_task_assignees";
import { Button } from "@/lib/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function AssignedUsersTable({ taskId }: { taskId: number }) {
  const { data: assignees = [], isLoading } = useTaskAssignees(taskId);
  const unassign = useUnassignTaskUser(taskId);

  if (isLoading) return <div>Loading assignees...</div>;

  if (!assignees.length)
    return <div className="text-sm text-muted-foreground">No assignees</div>;

  return (
    <div className="space-y-2">
      {assignees.map((u: any) => (
        <div
          key={u.id}
          className="flex items-center justify-between gap-4 p-2 border rounded-sm"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={u.profile_image || "https://github.com/shadcn.png"}
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{u.username}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
          </div>
          <div>
            <Button
              size="sm"
              className="h-7 text-sm w-fit"
              variant="destructive"
              onClick={() => unassign.mutate(u.id)}
              disabled={unassign.isLoading}
            >
              Unassign
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
