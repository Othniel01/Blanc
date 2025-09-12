"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  LineChart,
  Folder,
  MoreHorizontal,
  Settings2,
  Trash2,
} from "lucide-react";
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
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import { useProjects } from "@/lib/services/project";
type MoreButtonProps = {
  projectId: number;
};

export function MoreButton({ projectId }: MoreButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const router = useRouter();

  const { archive, duplicate, remove } = useProjects();

  const handleAction = async (label: string) => {
    setIsOpen(false);
    try {
      if (label === "Edit") {
        router.push(`/project/${projectId}`);
      } else if (label === "Archive") {
        archive.mutate(projectId, {
          onSuccess: () => {
            setIsOpen(false);
          },
        });
      } else if (label === "Duplicate") {
        duplicate.mutate(projectId, {
          onSuccess: (newProjectId) => {
            router.push(`/project/${newProjectId}`);
          },
        });
      } else if (label === "Delete") {
        setIsDeleteOpen(true);
      }
    } catch (error) {
      console.error(`${label} action failed:`, error);
    }
  };

  const confirmDelete = async () => {
    remove.mutate(projectId, {
      onSuccess: () => {
        setIsDeleteOpen(false);
      },
    });
  };

  React.useEffect(() => {
    if (!isDeleteOpen) {
      router.refresh(); // Refresh when dialog is closed
    }
  }, [isDeleteOpen, router]);

  const data = [
    [{ label: "Edit", icon: Settings2 }],
    [
      { label: "Archive", icon: Folder },
      { label: "Duplicate", icon: Copy },
      { label: "Delete", icon: Trash2 },
    ],
    [{ label: "View analytics", icon: LineChart }],
  ];

  return (
    <>
      {/* Main Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
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
