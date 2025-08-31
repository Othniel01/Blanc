import { ListView } from "@/lib/components/core/listView";

export default function ProjectsPage() {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Project Name" },
    { key: "tags", label: "Tags" }, // ✅ Added this
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status" },
  ];

  const data = [
    {
      id: 1,
      name: "School System",
      tags: ["Design", "Feature"],
      owner: "Ben",
      status: "active",
    },
    {
      id: 2,
      name: "Inventory",
      tags: ["Backend", "Database", "Performance"],
      owner: "Sarah",
      status: "archived",
    },
    {
      id: 3,
      name: "Clinic Module",
      tags: ["UI", "React", "Next.js", "Feature"],
      owner: "John",
      status: "draft",
    },
  ];

  return <ListView columns={columns} data={data} />;
}
