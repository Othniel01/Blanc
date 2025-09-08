// data.ts
export interface Task {
  id: number;
  name: string;
  status: string;
  description: string;
  tags: string[];
  assignees: { id: number; avatarUrl: string }[];
  stage_id: number;
  messageCount: number;
}

export interface Stage {
  id: number;
  name: string;
  sequence: number;
}
