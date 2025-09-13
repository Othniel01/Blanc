/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { NavFavorites } from "@/lib/components/nav-favorites";
import { NavMain } from "@/lib/components/navMain";
import { NavSecondary } from "@/lib/components/navSecondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/lib/components/ui/sidebar";
import { fetchFavouriteProjects } from "@/lib/routes/project";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [favorites, setFavorites] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const favs = await fetchFavouriteProjects();

        setFavorites(
          favs.map((p: any) => ({
            name: p.name,
            url: `/project/${p.id}/tasks`,
            emoji: "⭐",
          }))
        );
      } catch (err) {
        console.error("Failed to load sidebar data", err);
      }
    }
    loadData();
  }, []);

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <NavMain
          items={[
            { title: "Search", url: "#", icon: Search },
            { title: "Home", url: "/projects", icon: Home, isActive: true },
            { title: "Notifications", url: "#", icon: Inbox, badge: "10" },
          ]}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={favorites} />
        <NavSecondary
          items={[
            { title: "Settings", url: "#", icon: Settings2 },
            { title: "Trash", url: "#", icon: Trash2 },
            { title: "Help", url: "#", icon: MessageCircleQuestion },
          ]}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
