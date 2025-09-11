"use client";

import Kanban from "@/lib/components/core/kanban";
import { MainLayout } from "@/lib/components/layout";
import { Button } from "@/lib/components/ui/button";
import { useState } from "react";
import { useStages } from "@/lib/routes/stages";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/lib/components/ui/breadcrumb";

export default function Tasks() {
  const params = useParams();
  const projectId = Number(params?.id);
  const { createStage } = useStages(projectId);

  const [stageName, setStageName] = useState("");

  const handleAddStage = () => {
    if (!stageName.trim()) return;
    createStage.mutate(stageName);
    setStageName("");
  };

  return (
    <MainLayout>
      <div className="flex items-center p-2 gap-1">
        <Breadcrumb className="text-lg">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project {projectId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Link href={`/project/${projectId}/tasks/new`}>
          <Button variant="outline" className="h-8 text-xs w-14">
            New
          </Button>
        </Link>

        <div className="flex  items-center">
          <input
            type="text"
            placeholder="Add stages..."
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="border rounded-tl-sm rounded-bl-sm h-8 pl-2 text-sm border-sidebar-border"
          />
          <Button
            onClick={handleAddStage}
            className="rounded-tr-sm text-sm rounded-tl-none rounded-bl-none rounded-br-sm h-8"
          >
            Add
          </Button>
        </div>
      </div>

      <div className="bg-[#f5f6f8] p-4 flex gap-6 w-full h-full">
        {/* ✅ projectId now dynamic */}
        <Kanban projectId={projectId} />
      </div>
    </MainLayout>
  );
}
