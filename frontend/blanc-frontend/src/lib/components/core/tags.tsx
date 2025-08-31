"use client";
import { useState, KeyboardEvent, FocusEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/components/ui/command";

type Tag = {
  id?: number;
  name: string;
};

type TagsInputProps = {
  availableTags: Tag[]; // from DB
  onChange: (tags: Tag[]) => void;
};

export default function TagsInput({ availableTags, onChange }: TagsInputProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const addTag = (tag: Tag) => {
    if (!selectedTags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
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
        addTag({ name: inputValue }); // new tag
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
    // Close only if focus left the entire container
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
          className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
        >
          {tag.name}
          <button
            type="button"
            className="text-teal-600 hover:text-red-500"
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

  {/* Floating dropdown */}
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
