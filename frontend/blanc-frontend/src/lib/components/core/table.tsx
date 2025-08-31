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

import projectMembers from "../../data/table_data";
import { MoreVerticalIcon } from "lucide-react";

export function TableDemo() {
  return (
    <Table>
      <TableCaption>A list of your project members</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Code</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectMembers.map((member) => (
          <TableRow key={member.code}>
            <TableCell className="font-medium">{member.code}</TableCell>
            <TableCell>{member.username}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVerticalIcon type="icon" className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
