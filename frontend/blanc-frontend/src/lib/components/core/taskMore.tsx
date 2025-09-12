"use client";

import * as React from "react";
import { Copy, Folder, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/lib/components/ui/dialog";
import { useTasks } from "@/lib/services/task";

type TaskMoreButtonProps = {
  taskId: number;
  projectId: number;
  isDragging?: boolean;
};

export function TaskMoreButton({
  taskId,
  projectId,
  isDragging,
}: TaskMoreButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { archive, duplicate, remove } = useTasks(projectId);

  const handleAction = async (label: string) => {
    try {
      if (label === "Archive") {
        await archive.mutateAsync(taskId);
        setIsOpen(false);
      } else if (label === "Duplicate") {
        await duplicate.mutateAsync(taskId);
        setIsOpen(false);
      } else if (label === "Delete") {
        setIsDeleteOpen(true);
      }
    } catch (error) {
      console.error(`${label} action failed:`, error);
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(taskId);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Delete action failed:", error);
    }
  };

  const data = [
    [
      { label: "Archive", icon: Folder },
      { label: "Duplicate", icon: Copy },
      { label: "Delete", icon: Trash2 },
    ],
  ];

  // Prevent menu while dragging
  React.useEffect(() => {
    if (isDragging) setIsOpen(false);
  }, [isDragging]);

  return (
    <>
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
              {data.map((group, i) => (
                <SidebarGroup key={i} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, j) => (
                        <SidebarMenuItem key={j}>
                          <SidebarMenuButton
                            onClick={() => handleAction(item.label)}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
