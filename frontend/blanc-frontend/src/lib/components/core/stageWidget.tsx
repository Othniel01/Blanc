import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import { useStages } from "@/lib/routes/stages";

export default function StageWidget({
  taskId,
  projectId,
  currentStageId,
}: {
  taskId: number;
  projectId: number;
  currentStageId: number;
}) {
  const { stagesQuery, updateTaskStage } = useStages(projectId);
  const [activeStage, setActiveStage] = useState(currentStageId);

  if (stagesQuery.isLoading) return <p>Loading stages...</p>;
  if (stagesQuery.error) return <p>Error loading stages</p>;

  const stages = stagesQuery.data ?? [];

  const handleStageChange = (stageId: number) => {
    setActiveStage(stageId); // optimistic update
    updateTaskStage.mutate({ taskId, stageId });
  };

  return (
    <div className="w-fit">
      <Tabs
        className="w-fit"
        value={String(activeStage)}
        onValueChange={(val) => handleStageChange(Number(val))}
      >
        <TabsList>
          {stages.map((stage: any) => (
            <TabsTrigger
              key={stage.id}
              value={String(stage.id)}
              className="text-xs"
            >
              {stage.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
