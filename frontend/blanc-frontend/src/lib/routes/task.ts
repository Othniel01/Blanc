// lib/helpers/tasks.ts
import { authFetch } from "./http";
import endpoint from "./init";
import { fetchProjectTasks, getProjectMembers } from "./project";
import { Tag } from "./Tags";

export interface Task {
  id: number;
  name: string;
  description: string;
  tags: string[];
  assignees: { id: number; avatarUrl: string }[];
  status: string;
  stage_id: number;
  messageCount: number;
}

// -----------------------------
// Core Task Routes
// -----------------------------
export async function fetchTaskById(taskId: number): Promise<Task> {
  return authFetch(`${endpoint}/tasks/${taskId}`);
}

export async function updateTask(
  taskId: number,
  data: Partial<{
    name: string;
    description: string;
    due_date: string;
    status: string;
    active: boolean;
    stage_id: number;
    assignee_ids: number[];
    milestone_id: number;
    priority: number;
  }>
) {
  return authFetch(`${endpoint}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// -----------------------------
// Tasks with details (tags, assignees, message counts)
// -----------------------------
export async function fetchTasksWithDetails(
  projectId: number
): Promise<Task[]> {
  const tasks = (await fetchProjectTasks(projectId)) as any[];
  const members = await getProjectMembers(projectId);

  const taskIds = tasks.map((t) => t.id);

  // batch message counts
  let messageCounts: Record<number, number> = {};
  try {
    const counts = await authFetch(
      `${endpoint}/tasks/message-counts?task_ids=${taskIds.join(",")}`
    );
    messageCounts = counts;
  } catch (e) {
    console.warn("Failed to fetch message counts", e);
  }

  // fetch tags
  const tagsByTask: Record<number, string[]> = {};
  await Promise.all(
    taskIds.map(async (taskId) => {
      try {
        const tags = await authFetch(`${endpoint}/tasks/${taskId}/tags`);
        tagsByTask[taskId] = tags.slice(0, 3);
      } catch {
        tagsByTask[taskId] = [];
      }
    })
  );

  return tasks.map((task) => {
    const words = task.description?.split(" ") || [];
    const truncatedDescription =
      words.length > 12
        ? words.slice(0, 12).join(" ") + "..."
        : task.description;

    const assignees = (task.assignees || [])
      .map((id: number) => {
        const member = members.find((m: any) => m.id === id);
        return member ? { id: member.id, avatarUrl: member.avatarUrl } : null;
      })
      .filter(Boolean) as { id: number; avatarUrl: string }[];

    return {
      ...task,
      description: truncatedDescription,
      assignees,
      messageCount: messageCounts[task.id] || 0,
    } as Task;
  });
}

// -----------------------------
// Tag Routes (Task-specific)
// -----------------------------
export async function fetchTaskTags(taskId: number): Promise<Tag[]> {
  return authFetch(`${endpoint}/tasks/${taskId}/tags`);
}

export async function assignTaskTag(taskId: number, tagId: number) {
  return authFetch(`${endpoint}/tags/task/${taskId}/assign/${tagId}`, {
    method: "POST",
  });
}

export async function unassignTaskTag(taskId: number, tagId: number) {
  return authFetch(`${endpoint}/tags/task/${taskId}/unassign/${tagId}`, {
    method: "DELETE",
  });
}
