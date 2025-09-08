// lib/routes/projects.ts
import { authFetch } from "../routes/http";
import endpoint from "../routes/init";
import { fetchProjectTags } from "../routes/Tags";

export async function fetchProjects() {
  return authFetch(`${endpoint}/projects/projects`);
}

export async function fetchProjectsWithTags() {
  const projects = await fetchProjects();

  return Promise.all(
    projects.map(async (p: any) => {
      const tags = await fetchProjectTags(p.id);
      return {
        id: p.id,
        name: p.name,
        tags, // array of {id, name, color}
        owner: p.owner
          ? `${p.owner.first_name || ""} ${p.owner.last_name || ""}`.trim()
          : "—",
        status: p.status,
      };
    })
  );
}
