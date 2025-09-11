import React from "react";
import { Task } from "../../data/data";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageCircleMoreIcon } from "lucide-react";
import { TaskMoreButton } from "./taskMore";
import Link from "next/link";

interface Props {
  task: Task;
  stage_id: number;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export default function TaskCard({ task, stage_id, style, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: `task-${task.id}`, // Added prefix
      data: { type: "task", stage_id },
    });

  const internalStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  console.log(task);

  return (
    <Link
      href={`/project/${task.project_id}/tasks/${task.id}`}
      className="block" // makes link span the card
    >
      <div
        ref={setNodeRef}
        style={{ ...internalStyle, ...style }} // merge internal + external styles
        {...attributes}
        {...listeners}
        className="bg-white relative flex p-4 flex-col gap-1  rounded-sm  border text-sm"
      >
        <div
          className="absolute top-3 right-2"
          onClick={(e) => {
            e.preventDefault(); // stop Link navigation
            e.stopPropagation(); // stop event bubbling
          }}
        >
          <TaskMoreButton isDragging={isDragging} />
        </div>

        <h3 className="font-medium text-base">{task.name}</h3>
        <p className="text-sm text-gray-500">{task.description}</p>
        <div className="flex gap-1 flex-wrap mt-1">
          {(task.tags || []).slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              className="text-xs h-6"
              style={{ backgroundColor: tag.color ?? "#5F18DB", color: "#fff" }}
            >
              {tag.name}
            </Badge>
          ))}
          {task.tags && task.tags.length > 3 && (
            <Badge className="text-xs h-6">+{task.tags.length - 3}</Badge>
          )}
        </div>
        <hr className="w-full mt-4 h-[.5px] bg-gray-400" />
        <div className="mt-1 flex justify-between items-center">
          <div className="*:data-[slot=avatar]:ring-background  flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {task.assignees.slice(0, 3).map((user) => (
              <Avatar key={user.id}>
                <AvatarImage src={user.avatarUrl} alt={`User ${user.id}`} />
                <AvatarFallback>{user.id}</AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <span className="text-xs font-medium">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <MessageCircleMoreIcon />
              <p>{task.messageCount}</p>
            </div>
            <div className="border bg-gray-100 rounded-full border-sidebar-border h-8 w-8"></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
