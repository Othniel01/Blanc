// data.ts
export interface Task {
  id: string;
  name: string;
  description: string;
  tags: string[];
  assignees: string[];
  stageId: string;
}

export interface Stage {
  id: string;
  name: string;
  sequence: number;
}

export const stages: Stage[] = [
  { id: "1", name: "To Do", sequence: 1 },
  { id: "2", name: "In Progress", sequence: 2 },
  { id: "3", name: "In Review", sequence: 3 },
  { id: "4", name: "Done", sequence: 4 },
];

export const tasks: Task[] = [
  {
    id: "task-1",
    name: "Set up project",
    description:
      "Initialize repo and install dependencies, now lets get the bread and money",
    tags: ["setup"],
    assignees: ["Alice"],
    stageId: "2",
  },
  {
    id: "task-2",
    name: "Create Kanban UI",
    description: "Implement DND Kit kanban engine",
    tags: ["frontend"],
    assignees: ["Bob"],
    stageId: "4",
  },
];
