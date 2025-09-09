"use client";

import React, { useMemo, useState, FocusEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "@/lib/routes/project";
import { useAssignTaskUser } from "@/lib/hooks/use_task_assignees";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/lib/components/ui/command";
import { Button } from "@/lib/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Props {
  taskId: number;
  projectId: number;
}

export default function AssignUsers({ taskId, projectId }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const assignMutation = useAssignTaskUser(taskId);

  const filtered = useMemo(() => {
    if (!query) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m: any) =>
        (m.user.username && m.user.username.toLowerCase().includes(q)) ||
        (m.user.email && m.user.email.toLowerCase().includes(q))
    );
  }, [members, query]);

  const handleFocus = () => setIsOpen(true);
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full relative" onBlur={handleBlur}>
      <Command>
        <CommandInput
          placeholder="Search project members..."
          value={query}
          onValueChange={(v: string) => {
            setQuery(v);
            setSelected(null);
            setIsOpen(true); // open when typing
          }}
          onFocus={handleFocus}
        />
      </Command>

      {isOpen && (query || filtered.length > 0) && (
        <div className="absolute left-0 mt-1 w-full z-50 border rounded-md shadow-md bg-white">
          <Command>
            <CommandList>
              <CommandGroup heading="Members">
                {filtered.map((m: any) => (
                  <CommandItem
                    key={m.id}
                    value={String(m.id)}
                    onSelect={() => {
                      setSelected(m.user);
                      setQuery(""); // clear input
                      setIsOpen(false); // close dropdown
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage
                          alt={m.user.username || m.user.email}
                          src={
                            m.user.profile_image ||
                            m.user.avatarUrl ||
                            "https://github.com/shadcn.png"
                          }
                        />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {m.user.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.user.email}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No members
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1">
          {selected ? (
            <div className="flex items-center gap-2 text-sm">
              <Avatar>
                <AvatarImage
                  src={
                    selected.profile_image ||
                    selected.avatarUrl ||
                    "/avatar-placeholder.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selected.username}</div>
                <div className="text-xs text-muted-foreground">
                  {selected.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Choose a member above
            </div>
          )}
        </div>

        <Button
          disabled={!selected || assignMutation.isLoading}
          className="h-7 text-sm w-fit"
          onClick={() => {
            if (!selected) return;
            assignMutation.mutate(selected.id, {
              onSuccess: () => {
                setSelected(null);
                setQuery("");
                setIsOpen(false);
              },
            });
          }}
        >
          Assign
        </Button>
      </div>
    </div>
  );
}
