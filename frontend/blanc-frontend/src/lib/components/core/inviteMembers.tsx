/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { TableDemo } from "./table";
import { addProjectMember } from "@/lib/routes/project";
import { ErrorBlocking } from "./errorBlocking";

export default function InviteMembers({ projectId }: { projectId: number }) {
  const [inviteCode, setInviteCode] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null); // 🟢 track error

  async function handleInvite() {
    if (!inviteCode.trim()) return;
    try {
      const res = await addProjectMember(projectId, inviteCode);

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Failed to invite member");
        return;
      }

      setInviteCode("");
      setRefreshKey((k) => k + 1); // refresh table
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    }
  }

  return (
    <div>
      <div className="flex w-full items-center gap-4 mb-4">
        <label htmlFor="invite-code" className="text-sm font-medium">
          Invite Code
        </label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-60 border-b text-sm h-10 outline-none focus:border-teal-700"
          placeholder="Enter invite code"
          id="invite-code"
        />
        <Button className="w-18 text-xs h-8" onClick={handleInvite}>
          Invite
        </Button>
      </div>

      {/* error dialog only shows when error !== null */}
      {error && (
        <ErrorBlocking message={error} onClose={() => setError(null)} />
      )}

      {/* pass projectId and refreshKey down */}
      <TableDemo projectId={projectId} refreshKey={refreshKey} />
    </div>
  );
}
