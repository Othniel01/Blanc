import endpoint from "./init";
import { authFetch } from "./http"; // reuse same helper

export type Tag = {
  id: number;
  name: string;
  color: string;
};

// fetch all tags
export async function fetchTags(): Promise<Tag[]> {
  return authFetch(`${endpoint}/tags/`);
}

// fetch tags assigned to project
export async function fetchProjectTags(projectId: number): Promise<Tag[]> {
  return authFetch(`${endpoint}/projects/${projectId}/tags`);
}

// create new tag
export async function createTag(name: string, color = "#F5B027"): Promise<Tag> {
  return authFetch(`${endpoint}/tags/`, {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

// assign existing tag to project
export async function assignTag(projectId: number, tagId: number) {
  return authFetch(`${endpoint}/tags/project/${projectId}/assign/${tagId}`, {
    method: "POST",
  });
}

// unassign tag from project
export async function unassignTag(projectId: number, tagId: number) {
  return authFetch(`${endpoint}/tags/project/${projectId}/unassign/${tagId}`, {
    method: "DELETE",
  });
}
