// data.ts
export interface Task {
  id: number;
  name: string;
  status: string;
  description: string;
  tags: string[];
  assignees: { id: number; avatarUrl: string }[]; // changed from number[] to object[]
  stage_id: number;
  messageCount: number;
}

export interface Stage {
  id: number;
  name: string;
  sequence: number;
}

export const tasks: Task[] = [
  {
    id: 1,
    name: "Set up project",
    status: "approved",
    description:
      "Initialize repo and install dependencies, now lets get the bread and money",
    tags: ["setup"],
    assignees: [1, 2, 3, 4],
    stage_id: 2,
  },
  {
    id: 2,
    name: "Create Kanban UI",
    status: "approved",
    description: "Implement DND Kit kanban engine",
    tags: ["frontend"],
    assignees: [1],
    stage_id: 4,
  },
];
