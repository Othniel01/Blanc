"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/lib/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/lib/components/ui/checkbox";

// Types
type Column = {
  key: string;
  label: string;
};

type ListViewProps = {
  columns: Column[];
  data: Record<string, any>[]; // each row should have a unique "id"
};

export function ListView({ columns, data }: ListViewProps) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [visibleCols, setVisibleCols] = React.useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );

  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const filteredData = data.filter((row) => {
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = status ? row.status === status : true;

    return matchesSearch && matchesStatus;
  });

  const toggleColumn = (colKey: string) => {
    setVisibleCols((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(colKey)) {
        newSet.delete(colKey);
      } else {
        newSet.add(colKey);
      }
      return newSet;
    });
  };

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredData.map((row) => row.id)));
    }
  };

  // ✅ Utility to cut long text
  const truncate = (text: string, length = 30) =>
    text.length > length ? text.slice(0, length) + "..." : text;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["active", "archived", "draft"].map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatus(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setStatus(null)}>
                Clear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View / Column Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleCols.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-sm">
        <Table>
          <TableHeader className="bg-white">
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selected.size === filteredData.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>

              {columns
                .filter((c) => visibleCols.has(c.key))
                .map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.map((row, idx) => (
              <TableRow className="h-[20px]" key={row.id ?? idx}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggleRow(row.id)}
                  />
                </TableCell>

                {columns
                  .filter((c) => visibleCols.has(c.key))
                  .map((col) => {
                    // ✅ Special case for tags
                    if (col.key === "tags") {
                      const tags = Array.isArray(row.tags) ? row.tags : [];
                      return (
                        <TableCell key={col.key}>
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 2).map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs bg-gray-100 rounded"
                              >
                                {truncate(tag)}
                              </span>
                            ))}
                            {tags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{tags.length - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    }

                    // ✅ Default case: truncate long text
                    return (
                      <TableCell key={col.key}>
                        {typeof row[col.key] === "string"
                          ? truncate(row[col.key])
                          : row[col.key]}
                      </TableCell>
                    );
                  })}

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => alert("Edit row")}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alert("Duplicate row")}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alert("Archive row")}>
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => alert("Delete row")}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
