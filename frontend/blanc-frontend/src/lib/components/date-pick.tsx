"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/lib/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { Button } from "@/lib/components/ui/button";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected);
    onChange?.(selected);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="justify-start border-0 w-full border-b border-[transparent] rounded-none px-0 h-10 font-normal hover:border-gray-300 hover:bg-transparent focus:border-teal-700"
        >
          {date ? format(date, "PPP") : placeholder || "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
