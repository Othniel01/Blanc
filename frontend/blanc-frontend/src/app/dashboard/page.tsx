"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/lib/components/layout";
import { Grid, List, Flag, Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/components/ui/avatar";
import { MoreButton } from "@/lib/components/core/more";
import { Button } from "@/lib/components/ui/button";
import ProjectsPage from "@/lib/components/project-list";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import {
  fetchProjects,
  fetchProjectTags,
  fetchProjectTasks,
  fetchMe,
} from "@/lib/routes/project";
import ProtectedRoute from "@/lib/components/portected-route";
import Link from "next/link";

export default function Page() {
  const [view, setView] = useState<"card" | "list">("card");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchProjects();

        // Optionally enrich each project with tags + tasks + owner image
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
              console.warn(
                `Failed to fetch tasks for project ${project.id}`,
                e
              );
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

        setProjects(enriched);
      } catch (err) {
        console.error(err);
      }
    }

    loadProjects();
  }, []);

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Toggle Group */}
        <div className="flex border-t-1  h-12 justify-end p-4">
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

        {/* Conditionally Render View */}
        {view === "card" ? (
          // --- Card View ---
          <div
            className="grid w-full h-full bg-[#f5f6f8] p-4 gap-y-10 gap-x-1
            grid-cols-[repeat(auto-fit,minmax(320px,1fr))] auto-rows-min"
          >
            {projects.map((project) => (
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
                    <h1 className="font-medium text-base">{project.name}</h1>
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
                      e.stopPropagation(); // stop bubbling
                      e.preventDefault(); // stop link navigation
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
