// const projects = [
//   {
//     id: 1,
//     title: "Office Cleaning",
//     tags: ["Cleaning", "Corporate"],
//     tasks: 10,
//     dueDate: "21/03/2024",
//     avatar: "https://github.com/shadcn.png",
//   },
//   {
//     id: 2,
//     title: "Website Redesign",
//     tags: ["Design", "UI/UX"],
//     tasks: 8,
//     dueDate: "15/04/2024",
//     avatar: "https://github.com/shadcn.png",
//   },
//   {
//     id: 3,
//     title: "Marketing Campaign",
//     tags: ["Marketing", "Ads"],
//     tasks: 12,
//     dueDate: "01/05/2024",
//     avatar: "https://github.com/shadcn.png",
//   },
//   {
//     id: 4,
//     title: "Product Launch",
//     tags: ["Launch", "Sales"],
//     tasks: 5,
//     dueDate: "10/06/2024",
//     avatar: "https://github.com/shadcn.png",
//   },
// ];

// export default projects;

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token"); // get latest stored token
  if (!token) throw new Error("No auth token found");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`, // attach token
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return res.json();
}

export async function fetchProjects() {
  return authFetch("http://localhost:8000/projects/projects");
}

export async function fetchProjectById(projectId: number) {
  return authFetch(`http://localhost:8000/projects/projects/${projectId}`);
}

export async function fetchProjectTags(projectId: number) {
  return authFetch(`http://localhost:8000/projects/${projectId}/tags`);
}

export async function fetchProjectTasks(projectId: number) {
  return authFetch(`http://localhost:8000/projects/${projectId}/tasks`);
}

export async function fetchMe() {
  return authFetch("http://localhost:8000/users/me");
}
