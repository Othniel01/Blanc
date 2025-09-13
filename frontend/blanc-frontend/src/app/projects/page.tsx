/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/lib/components/layout";
import { Grid, List, Flag, Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/components/ui/avatar";
import { MoreButton } from "@/lib/components/core/more";
import { Button } from "@/lib/components/ui/button";
import ProjectsPage from "@/lib/components/projectList";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import {
  fetchProjects,
  fetchProjectTags,
  fetchProjectTasks,
  fetchMe,
} from "@/lib/routes/project";
import Link from "next/link";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { useState } from "react";
import ProtectedRoute from "@/lib/components/portectedRoute";

const fetchEnrichedProjects = async () => {
  const data = await fetchProjects();

  const enriched = await Promise.all(
    data.map(async (project: any) => {
      let tags: any[] = [];
      let tasks: any[] = [];
      let user: any = {};

      try {
        tags = (await fetchProjectTags(project.id)) ?? [];
      } catch (e) {
        console.warn(`Failed to fetch tags for project ${project.id}`, e);
      }

      try {
        tasks = (await fetchProjectTasks(project.id)) ?? [];
      } catch (e) {
        console.warn(`Failed to fetch tasks for project ${project.id}`, e);
      }

      try {
        user = (await fetchMe()) ?? {};
      } catch (e) {
        console.warn("Failed to fetch current user", e);
      }

      return {
        ...project,
        tags,
        tasks: tasks.length,
        avatar: user.profile_image || "https://github.com/shadcn.png",
        dueDate: project.end_date
          ? new Date(project.end_date).toLocaleDateString()
          : "N/A",
      };
    })
  );

  return enriched;
};

export default function Page() {
  const [view, setView] = useState<"card" | "list">("card");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchEnrichedProjects,
  });

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex border-t-1 h-12 justify-between p-1">
          <Link href="/project/new">
            <Button variant="outline" className="h-8 text-xs w-14">
              New
            </Button>
          </Link>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(val) => val && setView(val as "card" | "list")}
            className="gap-2"
          >
            <ToggleGroupItem value="card" className="" aria-label="Card view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {view === "card" ? (
          <div
            className="grid w-full h-full bg-[#f5f6f8] p-4 gap-5
    grid-cols-[repeat(auto-fit,minmax(320px,max-content))] auto-rows-min justify-start"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="bg-white rounded-[10px] relative w-[360px] p-4 h-[130px]"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-5 w-32 rounded-md" />
                      </div>
                      <div className="flex mt-2 gap-2 items-center">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-[80%] mt-3" />
                    </div>
                    <div className="absolute right-4 top-4">
                      <Skeleton className="h-5 w-5 rounded-md" />
                    </div>
                    <div className="absolute pr-8 bottom-2 w-full">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              : projects?.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}/tasks`}
                    className="bg-white cursor-pointer rounded-[10px] relative w-[360px] p-4 h-[130px]"
                  >
                    <div className="flex-col flex">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 hover:bg-yellow-300 w-7"
                        >
                          <Star />
                        </Button>
                        <h1 className="font-medium text-base">
                          {project.name}
                        </h1>
                      </div>
                      <div className="flex mt-2 gap-2 items-center">
                        {project.tags.slice(0, 3).map((tag: any) => (
                          <div
                            key={tag.id}
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: tag.color ?? "#5F18DB",
                              color: "#FFFFFF",
                            }}
                          >
                            {tag.name}
                          </div>
                        ))}
                        {project.tags.length > 3 && (
                          <div
                            key={`${project.id}-overflow`}
                            className="text-xs px-2 py-1 rounded-full bg-gray-300 text-gray-800"
                          >
                            +{project.tags.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="w-full h-[40px]" />
                    </div>
                    <div className="absolute right-4 top-4">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <MoreButton projectId={project.id} />
                      </div>
                    </div>
                    <div className="absolute pr-8 bottom-2 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex text-xs items-center gap-1">
                            <p>{project.tasks}</p>
                            <p className="font-medium">Tasks</p>
                          </div>
                          <div className="text-xs items-center gap-1 flex">
                            <Flag size="icon" className="w-3 h-3" />
                            <p className="text-gray-700">{project.dueDate}</p>
                          </div>
                        </div>
                        <Avatar>
                          <AvatarImage src={project.avatar} />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        ) : (
          <div className="w-full h-full bg-[#f5f6f8] p-2">
            <ProjectsPage />
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}
