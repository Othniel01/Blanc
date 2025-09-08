import endpoint from "./init";
import { authFetch } from "./http";

export async function fetchProjects() {
  return authFetch(`${endpoint}/projects/projects`);
}

export async function fetchProjectById(projectId: number) {
  return authFetch(`${endpoint}/projects/${projectId}`);
}

export async function updateProject(projectId: number, payload: unknown) {
  return authFetch(`${endpoint}/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchProjectTags(projectId: number) {
  try {
    return (await authFetch(`${endpoint}/projects/${projectId}/tags`)) ?? [];
  } catch (e) {
    console.warn(`Failed to fetch tags for project ${projectId}`, e);
    return [];
  }
}

export async function fetchProjectTasks(projectId: number) {
  try {
    return (await authFetch(`${endpoint}/projects/${projectId}/tasks`)) ?? [];
  } catch (e) {
    console.warn(`Failed to fetch tasks for project ${projectId}`, e);
    return [];
  }
}

export async function fetchMe() {
  return authFetch(`${endpoint}/users/me`);
}

export async function getProjectMembers(projectId: number) {
  return authFetch(`${endpoint}/projects/${projectId}/members`);
}

export async function addProjectMember(projectId: number, inviteCode: string) {
  return authFetch(`${endpoint}/projects/${projectId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invite_code: inviteCode }),
  });
}

export async function removeProjectMember(projectId: number, userId: number) {
  return authFetch(`${endpoint}/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}
