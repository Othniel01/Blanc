"use client";

import React, { useEffect, useState } from "react";
import { Toggle } from "@/lib/components/ui/toggle";
import { StarIcon } from "lucide-react";
import { updateProject } from "@/lib/routes/project";

type IsFavouriteProps = {
  projectId: number;
  initialValue?: boolean | number | null;
  onUpdated?: (newVal: boolean) => void;
};

export default function IsFavourite({
  projectId,
  initialValue = false,
  onUpdated,
}: IsFavouriteProps) {
  // ensure we store a boolean
  const toBool = (v: any) => v === 1 || v === "1" || v === true;
  const [isFavourite, setIsFavourite] = useState<boolean>(toBool(initialValue));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFavourite(toBool(initialValue));
  }, [initialValue]);

  const handlePressedChange = async (maybePressed?: boolean | any) => {
    const newValue =
      typeof maybePressed === "boolean" ? maybePressed : !isFavourite;

    setIsFavourite(newValue);
    setLoading(true);

    try {
      await updateProject(projectId, { is_favourite: newValue });

      onUpdated?.(newValue);
    } catch (err) {
      console.error("Failed to update favourite:", err);

      setIsFavourite(!newValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline">
      <Toggle
        pressed={isFavourite}
        onPressedChange={handlePressedChange}
        disabled={loading}
        className="data-[state=on]:bg-yellow-300 hover:text-yellow-800 hover:bg-yellow-400"
        aria-label="Favourite project"
      >
        <StarIcon
          fill={isFavourite ? "yellow" : "transparent"}
          className={`h-5 w-5 ${
            isFavourite ? "text-yellow-800" : "text-gray-800"
          }`}
        />
      </Toggle>
    </div>
  );
}
