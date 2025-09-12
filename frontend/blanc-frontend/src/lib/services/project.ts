"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  archiveProject,
  duplicateProject,
  deleteProject,
} from "@/lib/routes/project";

export function useProjects() {
  const queryClient = useQueryClient();

  const archive = useMutation({
    mutationFn: (id: number) => archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const duplicate = useMutation({
    mutationFn: (id: number) => duplicateProject(id),
    onSuccess: (newProjectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      return newProjectId;
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return { archive, duplicate, remove };
}
