"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { getProjectMembers, removeProjectMember } from "@/lib/routes/project";

export function TableDemo({
  projectId,
  refreshKey,
}: {
  projectId: number;
  refreshKey: number;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>(""); // will come from auth/session

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await getProjectMembers(projectId);
        setMembers(data);
        // If your backend returns current user role, set it here
        // Otherwise, store role in auth context and setCurrentUserRole(roleFromAuth)
      } catch (err: any) {
        console.error("Failed to fetch members", err);
      }
    }
    fetchMembers();
  }, [projectId, refreshKey]);

  async function handleRemove(userId: number) {
    if (currentUserRole !== "manager") {
      alert("Only project managers can remove members.");
      return;
    }
    try {
      await removeProjectMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  }

  return (
    <Table>
      <TableCaption>A list of your project members</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">
              {member.user.invite_code}
            </TableCell>
            <TableCell>{member.user.username}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVerticalIcon className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleRemove(member.user.id)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
