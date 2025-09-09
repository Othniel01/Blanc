import { Toggle } from "@/lib/components/ui/toggle";
import { StarIcon } from "lucide-react";

export default function Isfavourite() {
  return (
    <div className="inline ">
      <Toggle
        className="data-[state=on]:bg-yellow-400 hover:bg-yellow-400"
        aria-label="Favourite item"
      >
        <StarIcon className="h-5 w-5" />
      </Toggle>
    </div>
  );
}
