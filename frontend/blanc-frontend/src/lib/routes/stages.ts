import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import endpoint from "@/lib/routes/init";
import { authFetch } from "@/lib/routes/http";

export function useStages(projectId: number) {
  const queryClient = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: ["stages", projectId],
    queryFn: () => authFetch(`${endpoint}/projects/${projectId}/stages/`),
  });

  const createStage = useMutation({
    mutationFn: async (name: string) => {
      // 🔹 compute next sequence from cached data
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

  const updateStage = useMutation({
    mutationFn: (stage: { id: number; sequence: number }) =>
      authFetch(`${endpoint}/projects/${projectId}/stages/${stage.id}`, {
        method: "PATCH",
        body: JSON.stringify({ sequence: stage.sequence }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] });
    },
  });

  return { stagesQuery, createStage, updateStage };
}
