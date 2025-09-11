"use client";

import React, { useEffect, useState } from "react";
import { StarIcon } from "lucide-react";
import { updateTask } from "@/lib/routes/task";

type PriorityRatingProps = {
  taskId?: number; // optional now
  initialPriority?: number | null;
  size?: number;
  readOnly?: boolean;
  className?: string;
  onUpdated?: (priority: number | null) => void;
  deferUpdate?: boolean; // 🔥 new flag
};

export default function PriorityRating({
  taskId,
  initialPriority = null,
  size = 18,
  readOnly = false,
  className = "",
  onUpdated,
  deferUpdate = false, // default: false = update backend
}: PriorityRatingProps) {
  const normalize = (v: any) => {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(5, Math.floor(n)));
  };

  const [rating, setRating] = useState<number>(normalize(initialPriority));
  const [hover, setHover] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRating(normalize(initialPriority));
  }, [initialPriority]);

  const doUpdate = async (clicked: number) => {
    if (readOnly || loading) return;

    const newRating = clicked === rating ? 0 : clicked;
    const prev = rating;

    setRating(newRating);

    if (deferUpdate) {
      // ✅ just inform parent, don’t hit backend
      onUpdated?.(newRating === 0 ? null : newRating);
      return;
    }

    if (!taskId) return; // guard

    setLoading(true);
    try {
      await updateTask(taskId, {
        priority: newRating === 0 ? null : newRating,
      });
      onUpdated?.(newRating === 0 ? null : newRating);
    } catch (err) {
      console.error("Failed to update task priority:", err);
      setRating(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label="Task priority"
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = hover ? i <= hover : i <= rating;

        return (
          <button
            key={i}
            type="button"
            onClick={() => doUpdate(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            disabled={readOnly || loading}
            role="radio"
            aria-checked={i === rating}
            aria-label={`Set priority ${i}`}
            className={`p-1 ${loading ? "opacity-60" : ""}`}
          >
            <StarIcon
              fill={filled ? "currentColor" : "transparent"}
              width={size}
              height={size}
              className={filled ? "text-yellow-400" : "text-gray-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
