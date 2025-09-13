// components/SubTaskList.tsx
"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Pencil, Trash } from "lucide-react";
import {
  fetchSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "@/lib/routes/subTask";

type SubTask = {
  id: number;
  title: string;
  is_done: boolean;
  task_id: number;
};

export default function SubTaskList({ taskId }: { taskId: number }) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSubtasks(taskId);
      setSubtasks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [taskId]);

  async function handleToggle(subtask: SubTask) {
    const updated = await updateSubtask(taskId, subtask.id, {
      is_done: !subtask.is_done,
    });
    setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? updated : s)));
  }

  async function handleDelete(id: number) {
    await deleteSubtask(taskId, id);
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    const created = await createSubtask(taskId, newTitle.trim());
    setSubtasks((prev) => [...prev, created]);
    setNewTitle("");
  }

  async function handleEditSave(id: number, title: string) {
    const updated = await updateSubtask(taskId, id, { title });
    setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setEditingId(null);
  }

  return (
    <div className="space-y-3">
      {loading && <p className="text-sm text-gray-500">Loading subtasks...</p>}

      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={subtask.is_done}
              onCheckedChange={() => handleToggle(subtask)}
            />
            {editingId === subtask.id ? (
              <Input
                defaultValue={subtask.title}
                autoFocus
                onBlur={(e) => handleEditSave(subtask.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    handleEditSave(
                      subtask.id,
                      (e.target as HTMLInputElement).value
                    );
                }}
              />
            ) : (
              <span
                className={`${
                  subtask.is_done ? "line-through text-gray-500" : ""
                }`}
              >
                {subtask.title}
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEditingId(subtask.id)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(subtask.id)}>
                <Trash className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <div className="flex items-center space-x-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add subtask..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button size="icon" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
