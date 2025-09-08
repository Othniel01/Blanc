import endpoint from "./init";
import { authFetch } from "./http";

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export async function fetchTags(): Promise<Tag[]> {
  return authFetch(`${endpoint}/tags/`);
}

export async function fetchProjectTags(projectId: number): Promise<Tag[]> {
  return authFetch(`${endpoint}/projects/${projectId}/tags`);
}

export async function createTag(name: string, color = "#F5B027"): Promise<Tag> {
  return authFetch(`${endpoint}/tags/`, {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

// export async function assignTag(projectId: number, tagId: number) {
//   return authFetch(`${endpoint}/tags/project/${projectId}/assign/${tagId}`, {
//     method: "POST",
//   });
// }

// export async function unassignTag(projectId: number, tagId: number) {
//   return authFetch(`${endpoint}/tags/project/${projectId}/unassign/${tagId}`, {
//     method: "DELETE",
//   });
// }
