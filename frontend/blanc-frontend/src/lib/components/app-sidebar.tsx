"use client";

import * as React from "react";
import {
  AudioWaveform,
  // Blocks,
  // Calendar,
  Command,
  Home,
  // Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  // Sparkles,
  Trash2,
} from "lucide-react";

import { NavFavorites } from "@/lib/components/nav-favorites";
import { NavMain } from "@/lib/components/nav-main";
import { NavSecondary } from "@/lib/components/nav-secondary";
import { NavWorkspaces } from "@/lib/components/nav-workspaces";
// import { TeamSwitcher } from "@/lib/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/lib/components/ui/sidebar";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    // {
    //   title: "Ask AI",
    //   url: "#",
    //   icon: Sparkles,
    // },
    {
      title: "Home",
      url: "/projects",
      icon: Home,
      isActive: true,
    },
    // {
    //   title: "Inbox",
    //   url: "#",
    //   icon: Inbox,
    //   badge: "10",
    // },
  ],
  navSecondary: [
    // {
    //   title: "Calendar",
    //   url: "#",
    //   icon: Calendar,
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    // {
    //   title: "Templates",
    //   url: "#",
    //   icon: Blocks,
    // },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
  favorites: [
    {
      name: "Project Management & Task Tracking",
      url: "/project/1",
      emoji: "📊",
    },
    {
      name: "Family Recipe Collection & Meal Planning",
      url: "#",
      emoji: "🍳",
    },
    {
      name: "Fitness Tracker & Workout Routines",
      url: "#",
      emoji: "💪",
    },
  ],
  goal: [
    {
      name: "Personal Life Management",
      emoji: "🏠",
      pages: [
        // {
        //   name: "Daily Journal & Reflection",
        //   url: "#",
        //   emoji: "📔",
        // },
        // {
        //   name: "Health & Wellness Tracker",
        //   url: "#",
        //   emoji: "🍏",
        // },
        // {
        //   name: "Personal Growth & Learning Goals",
        //   url: "#",
        //   emoji: "🌟",
        // },
      ],
    },
    {
      name: "Professional Development",
      emoji: "💼",
      pages: [
        {
          name: "Skill Acquisition & Training Log",
          url: "#",
          emoji: "🧠",
        },
        {
          name: "Networking Contacts & Events",
          url: "#",
          emoji: "🤝",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}

        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.goal} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
