"use client";

import Kanban from "@/lib/components/core/kanban";
import { MainLayout } from "@/lib/components/layout";

import { Button } from "@/lib/components/ui/button";

import { useState } from "react";
import { useStages } from "@/lib/routes/stages";

export default function Tasks() {
  const projectId = 1;
  const { createStage } = useStages(projectId);
  const [stageName, setStageName] = useState("");

  const handleAddStage = () => {
    if (!stageName.trim()) return;
    createStage.mutate(stageName);
    setStageName("");
  };

  return (
    <MainLayout>
      <div className="flex p-2 items-center">
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

      <div className="bg-[#f5f6f8] p-4 flex gap-6 w-full h-full">
        <Kanban projectId={projectId} />
      </div>
    </MainLayout>
  );
}
