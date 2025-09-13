import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/lib/routes/task";
import { Task } from "../data/data";

export interface UpdateTaskStageInput {
  taskId: number;
  stage_id: number;
}

export function useUpdateTaskStage(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, stage_id }: UpdateTaskStageInput) => {
      await updateTask(taskId, { stage_id });
    },
    onMutate: async ({ taskId, stage_id }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      const previousTasks = queryClient.getQueryData<Task[]>([
        "tasks",
        projectId,
      ]);

      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, stage_id } : t))
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["tasks", projectId],
          context.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}
