import endpoint from "./init";
import { authFetch } from "./http";

export async function fetchProjects({
  manager_only,
  member_only,
  favourite,
  archived,
  start_date,
  end_date,
  tags,
  skip,
  limit,
}: {
  manager_only?: boolean;
  member_only?: boolean;
  favourite?: boolean;
  archived?: boolean;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  skip?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();

  if (manager_only !== undefined)
    params.append("manager_only", String(manager_only));
  if (member_only !== undefined)
    params.append("member_only", String(member_only));
  if (favourite !== undefined) params.append("favourite", String(favourite));
  if (archived !== undefined) params.append("archived", String(archived));
  if (start_date) params.append("start_date", start_date); // must be "YYYY-MM-DD"
  if (end_date) params.append("end_date", end_date);
  if (tags) tags.forEach((tag) => params.append("tags", tag));
  if (skip !== undefined) params.append("skip", String(skip));
  if (limit !== undefined) params.append("limit", String(limit));

  return authFetch(`${endpoint}/projects/projects?${params.toString()}`);
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

// Fetch favourite projects
export async function fetchFavouriteProjects() {
  return authFetch(`${endpoint}/projects/projects/favourites`);
}

// Fetch non-favourite projects
export async function fetchNonFavouriteProjects() {
  return authFetch(`${endpoint}/projects/projects/non-favourites`);
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

export async function createProject(data: {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}) {
  return authFetch(`${endpoint}/projects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function archiveProject(projectId: number) {
  return authFetch(`${endpoint}/projects/${projectId}/archive`, {
    method: "PUT",
  });
}

export async function duplicateProject(projectId: number) {
  const res = await authFetch(`${endpoint}/projects/${projectId}/duplicate`, {
    method: "POST",
  });
  // Backend returns { duplicated: newProjectId }
  return res.duplicated;
}

export async function deleteProject(projectId: number) {
  return authFetch(`${endpoint}/projects/${projectId}`, {
    method: "DELETE",
  });
}
