import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import endpoint from "@/lib/routes/init";
import { authFetch } from "@/lib/routes/http";

export function useStages(projectId: number) {
  const queryClient = useQueryClient();

  // 🔹 Fetch all stages for a project
  const stagesQuery = useQuery({
    queryKey: ["stages", projectId],
    queryFn: () => authFetch(`${endpoint}/projects/${projectId}/stages/`),
  });

  // 🔹 Create a new stage
  const createStage = useMutation({
    mutationFn: async (name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingStages: any[] =
        queryClient.getQueryData(["stages", projectId]) ?? [];
      const nextSequence =
        existingStages.length > 0
          ? Math.max(...existingStages.map((s) => s.sequence)) + 1
          : 1;

      return authFetch(`${endpoint}/projects/${projectId}/stages/`, {
        method: "POST",
        body: JSON.stringify({ name, sequence: nextSequence }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] });
    },
  });

  // 🔹 Update a stage's name or sequence
  const updateStage = useMutation({
    mutationFn: (stage: { id: number; name?: string; sequence?: number }) =>
      authFetch(`${endpoint}/projects/${projectId}/stages/${stage.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(stage.name !== undefined && { name: stage.name }),
          ...(stage.sequence !== undefined && { sequence: stage.sequence }),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] });
    },
  });

  // 🔹 Delete a stage
  const deleteStage = useMutation({
    mutationFn: (stageId: number) =>
      authFetch(`${endpoint}/projects/${projectId}/stages/${stageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] });
    },
  });

  // 🔹 Update a task's stage
  const updateTaskStage = useMutation({
    mutationFn: ({ taskId, stageId }: { taskId: number; stageId: number }) =>
      authFetch(`${endpoint}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ stage_id: stageId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return {
    stagesQuery,
    createStage,
    updateStage,
    deleteStage,
    updateTaskStage,
  };
}
