import endpoint from "./init";
import { authFetch } from "./http";

// generic fetch with auth

// get all projects
export async function fetchProjects() {
  return authFetch(`${endpoint}/projects/projects`);
}

// get single project
export async function fetchProjectById(projectId: number) {
  return authFetch(`${endpoint}/projects/${projectId}`);
}

// update project
export async function updateProject(projectId: number, payload: unknown) {
  return authFetch(`${endpoint}/projects/${projectId}`, {
    method: "PUT", // or PATCH depending on your backend
    body: JSON.stringify(payload),
  });
}

// get project tags safely
export async function fetchProjectTags(projectId: number) {
  try {
    return (await authFetch(`${endpoint}/projects/${projectId}/tags`)) ?? [];
  } catch (e) {
    console.warn(`Failed to fetch tags for project ${projectId}`, e);
    return [];
  }
}

// get project tasks safely
export async function fetchProjectTasks(projectId: number) {
  try {
    return (await authFetch(`${endpoint}/projects/${projectId}/tasks`)) ?? [];
  } catch (e) {
    console.warn(`Failed to fetch tasks for project ${projectId}`, e);
    return [];
  }
}
// get current user
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
