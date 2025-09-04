"use client";

import { useEffect, useState } from "react";
import { ListView } from "@/lib/components/core/listView";
import { fetchProjectsWithTags } from "@/lib/services/projectHelper";

export default function ProjectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Project Name" },
    { key: "tags", label: "Tags" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status" },
  ];

  useEffect(() => {
    fetchProjectsWithTags()
      .then(setProjects)
      .catch((err) => console.error("Failed to load projects", err));
  }, []);

  return <ListView columns={columns} data={projects} />;
}
