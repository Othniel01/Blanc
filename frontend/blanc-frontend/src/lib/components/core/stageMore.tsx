"use client";

import * as React from "react";
import { Folder, MoreHorizontal, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/lib/components/ui/sidebar";
import { Input } from "@/lib/components/ui/input";
import { useStages } from "@/lib/routes/stages";
import { bulkArchiveTasks } from "@/lib/routes/task";

// --- Props ---
interface MoreButtonProps {
  isDragging?: boolean;
  projectId: number;
  stageId: number;
  taskIdsInStage: number[];
  onStageUpdated?: () => void;
}

export function StageMoreButton({
  isDragging,
  projectId,
  stageId,
  taskIdsInStage,
  onStageUpdated,
}: MoreButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [stageName, setStageName] = React.useState("");

  // Hooks from stage.ts helper
  const { updateStage, deleteStage } = useStages(projectId);

  // Prevent opening if dragging
  React.useEffect(() => {
    if (isDragging) setIsOpen(false);
  }, [isDragging]);

  const handleUpdateStage = async () => {
    if (!stageName.trim()) return;
    updateStage.mutate(
      { id: stageId, name: stageName },
      {
        onSuccess: () => {
          setEditing(false);
          setIsOpen(false);
          onStageUpdated?.();
        },
      }
    );
  };

  const handleDeleteStage = async () => {
    deleteStage.mutate(stageId, {
      onSuccess: () => {
        setIsOpen(false);
        onStageUpdated?.();
      },
    });
  };

  const archiveStageTasks = async () => {
    if (!taskIdsInStage.length) return;

    const result = await bulkArchiveTasks(taskIdsInStage);

    if (result.archived.length) {
      console.log("Archived tasks:", result.archived);
    }
    if (result.unauthorized.length) {
      console.warn("Unauthorized tasks:", result.unauthorized);
    }
    if (result.not_found.length) {
      console.warn("Tasks not found:", result.not_found);
    }

    setIsOpen(false);
    onStageUpdated?.();
  };

  return (
    <Popover open={isDragging ? false : isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-accent h-7 w-7"
        >
          <MoreHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 overflow-hidden rounded-lg p-0"
        align="end"
      >
        <Sidebar collapsible="none" className="bg-transparent">
          <SidebarContent>
            {/* Edit */}
            <SidebarGroup className="border-b">
              <SidebarGroupContent className="gap-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setEditing(true)}>
                      <Settings2 /> <span>Edit</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Archive + Delete */}
            <SidebarGroup>
              <SidebarGroupContent className="gap-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={archiveStageTasks}>
                      <Folder /> <span>Archive tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleDeleteStage}
                      className="text-red-500"
                    >
                      <Trash2 /> <span>Delete stage</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Inline edit popover */}
        {editing && (
          <div className="p-3 border-t">
            <Input
              placeholder="New stage name"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateStage}>
                Save
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
