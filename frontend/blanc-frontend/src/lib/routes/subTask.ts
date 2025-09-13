/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/routes/subtasks.ts
import { authFetch } from "@/lib/routes/http";
import endpoint from "@/lib/routes/init";

export async function fetchSubtasks(taskId: number) {
  return authFetch(`${endpoint}/tasks/${taskId}/subtasks`);
}

export async function createSubtask(taskId: number, title: string) {
  return authFetch(`${endpoint}/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title, is_done: false }),
  });
}

export async function updateSubtask(
  taskId: number,
  subtaskId: number,
  data: any
) {
  return authFetch(`${endpoint}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSubtask(taskId: number, subtaskId: number) {
  return authFetch(`${endpoint}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
}
