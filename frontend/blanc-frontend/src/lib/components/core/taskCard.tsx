import React from "react";
import { Task } from "../../data/data";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MoreButton } from "./more";
import { MessageCircleMoreIcon } from "lucide-react";
import { TaskMoreButton } from "./taskMore";

interface Props {
  task: Task;
  stageId: number;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export default function TaskCard({ task, stageId, style, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: `task-${task.id}`, // Added prefix
      data: { type: "task", stageId },
    });

  const internalStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...internalStyle, ...style }} // merge internal + external styles
      {...attributes}
      {...listeners}
      className="bg-white relative flex p-4 flex-col gap-1  rounded-sm  border text-sm"
    >
      <div className="absolute top-3 right-2">
        <TaskMoreButton isDragging={isDragging} />
      </div>

      <h3 className="font-medium text-base">{task.name}</h3>
      <p className="text-sm text-gray-500">{task.description}</p>
      <Badge className="h-7 text-sm rounded-full mt-2">Feature</Badge>
      <hr className="w-full mt-4 h-[.5px] bg-gray-400" />
      <div className="mt-1 flex justify-between items-center">
        <div className="*:data-[slot=avatar]:ring-background  flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/leerob.png" alt="@leerob" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/evilrabbit.png"
              alt="@evilrabbit"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <MessageCircleMoreIcon />
            <p>3</p>
          </div>
          <div className="border bg-gray-100 rounded-full border-sidebar-border h-8 w-8"></div>
        </div>
      </div>
    </div>
  );
}
