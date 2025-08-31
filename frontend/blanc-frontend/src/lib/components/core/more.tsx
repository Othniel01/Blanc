"use client";

import * as React from "react";
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

const data = [
  [
    {
      label: "Edit",
      icon: Settings2,
    },
  ],
  [
    {
      label: "Archive",
      icon: Folder,
    },
    {
      label: "Duplicate",
      icon: Copy,
    },
    {
      label: "Move to Trash",
      icon: Trash2,
    },
  ],
  [
    {
      label: "View analytics",
      icon: LineChart,
    },
  ],
  //   [
  //     // {
  //     //   label: "Import",
  //     //   icon: ArrowUp,
  //     // },
  //     // {
  //     //   label: "Export",
  //     //   icon: ArrowDown,
  //     // },
  //   ],
];

export function MoreButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  return (
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
            {data.map((group, index) => (
              <SidebarGroup key={index} className="border-b last:border-none">
                <SidebarGroupContent className="gap-0">
                  <SidebarMenu>
                    {group.map((item, index) => (
                      <SidebarMenuItem key={index}>
                        <SidebarMenuButton>
                          <item.icon /> <span>{item.label}</span>
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
  );
}
