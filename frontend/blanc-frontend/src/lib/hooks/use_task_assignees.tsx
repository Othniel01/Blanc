// hooks/useTaskAssignees.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTaskAssignees,
  assignTaskUser,
  unassignTaskUser,
  Assignee,
} from "@/lib/routes/task";

export function useTaskAssignees(taskId: number) {
  return useQuery<Assignee[], Error>({
    queryKey: ["taskAssignees", taskId],
    queryFn: () => fetchTaskAssignees(taskId),
    enabled: !!taskId,
  });
}

export function useAssignTaskUser(taskId: number) {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (userId) => assignTaskUser(taskId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["taskAssignees", taskId] }),
  });
}

export function useUnassignTaskUser(taskId: number) {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (userId) => unassignTaskUser(taskId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["taskAssignees", taskId] }),
  });
}
