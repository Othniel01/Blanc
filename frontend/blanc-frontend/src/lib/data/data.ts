import { Tag } from "../routes/Tags";

// data.ts
export interface Task {
  id: number;
  name: string;
  project_id: number;
  description: string;
  tags: Tag[];
  assignees: {
    username: string;
    id: number;
    profile_image: string | null;
  }[];
  status: string;
  stage_id: number;
  messageCount: number;
}

export interface Stage {
  id: number;
  name: string;
  sequence: number;
}
