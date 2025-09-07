// data.ts
export interface Task {
  id: number;
  name: string;
  description: string;
  tags: string[];
  assignees: string[];
  stageId: number;
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
    description:
      "Initialize repo and install dependencies, now lets get the bread and money",
    tags: ["setup"],
    assignees: ["Alice"],
    stageId: 2,
  },
  {
    id: 2,
    name: "Create Kanban UI",
    description: "Implement DND Kit kanban engine",
    tags: ["frontend"],
    assignees: ["Bob"],
    stageId: 4,
  },
];
