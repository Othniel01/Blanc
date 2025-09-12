/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/routes/http";
import endpoint from "@/lib/routes/init";

export function useTasks(projectId: number) {
  const queryClient = useQueryClient();

  const archive = useMutation({
    mutationFn: (id: number) =>
      authFetch(`${endpoint}/tasks/${id}/archive`, { method: "PUT" }),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      queryClient.setQueryData(["tasks", projectId], (old: any[] | undefined) =>
        old?.map((task) =>
          task.id === id ? { ...task, archived: true } : task
        )
      );
      return { previousTasks };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const duplicate = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`${endpoint}/tasks/${id}/duplicate`, {
        method: "POST",
      });
      return res.duplicated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      authFetch(`${endpoint}/tasks/${id}`, { method: "DELETE" }),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      queryClient.setQueryData(["tasks", projectId], (old: any[] | undefined) =>
        old?.filter((task) => task.id !== id)
      );
      return { previousTasks };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return { archive, duplicate, remove };
}
