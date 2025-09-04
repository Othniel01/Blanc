"use client";
import { useState, useEffect, KeyboardEvent, FocusEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/components/ui/command";

export type Tag = {
  id?: number;
  name: string;
  color?: string; // include color
};

type TagsInputProps = {
  availableTags: Tag[]; // all tags from /tags/
  initialTags?: Tag[]; // pre-assigned project tags
  onChange: (tags: Tag[]) => void; // notify parent of current selection
};

export default function TagsInput({
  availableTags,
  initialTags = [],
  onChange,
}: TagsInputProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // load initial project tags
  useEffect(() => {
    if (initialTags.length) {
      setSelectedTags(initialTags);
    }
  }, [initialTags]);

  const addTag = (tag: Tag) => {
    if (
      !selectedTags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase())
    ) {
      const updated = [...selectedTags, tag];
      setSelectedTags(updated);
      onChange(updated);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const removeTag = (tagName: string) => {
    const updated = selectedTags.filter((t) => t.name !== tagName);
    setSelectedTags(updated);
    onChange(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      const existing = availableTags.find(
        (t) => t.name.toLowerCase() === inputValue.toLowerCase()
      );
      if (existing) {
        addTag(existing);
      } else {
        // "new" tag (no id yet) → backend will create on save
        addTag({ name: inputValue, color: "#F5B027" });
      }
    }
  };

  const filteredTags = availableTags.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.some((s) => s.name === t.name)
  );

  const handleFocus = () => setIsOpen(true);
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-[60%] relative" onBlur={handleBlur}>
      <div className="border-b-0 border-gray-300 p-2 focus-within:border-teal-700">
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id ?? tag.name}
              className="px-2 py-1 rounded-full text-white text-xs flex items-center gap-1"
              style={{
                backgroundColor: tag.color ?? "#5F18DB",
                color: "#FFFFFF",
              }}
            >
              {tag.name}
              <button
                type="button"
                className="ml-1 text-gray-600 hover:text-red-500"
                onClick={() => removeTag(tag.name)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input always goes to new line under tags */}
        <Command className="mt-2 border-none shadow-none w-full ">
          <CommandInput
            placeholder="Add tags..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
          />
        </Command>
      </div>

      {isOpen && (inputValue || filteredTags.length > 0) && (
        <div className="absolute left-0 mt-1 w-full z-50 border rounded-md shadow-md bg-white">
          <Command>
            <CommandList>
              {inputValue && (
                <CommandEmpty>
                  Press <kbd>Enter</kbd> to create &quot;{inputValue}&quot;
                </CommandEmpty>
              )}
              {filteredTags.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {filteredTags.map((tag) => (
                    <CommandItem key={tag.id} onSelect={() => addTag(tag)}>
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
