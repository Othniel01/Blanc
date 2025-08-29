"use client"

import * as React from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/lib/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/components/ui/popover"
import { Button } from "@/lib/components/ui/button"
import { ArrowRightIcon } from "lucide-react"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(value)

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    onChange?.(range)
  }

  return (
    <div className="flex items-center gap-2 w-[60%]">
      {/* Start Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start border-0 border-b border-gray-300 rounded-none px-0 h-10 font-normal hover:border-gray-400 focus:border-teal-700"
          >
            {dateRange?.from ? format(dateRange.from, "PPP") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full">

    <Calendar
      mode="range"
      defaultMonth={dateRange?.from}
      selected={dateRange}
      onSelect={handleSelect}
      numberOfMonths={2}
       className="rounded-lg border w-full shadow-sm"
    />

</PopoverContent>
      </Popover>

      {/* Arrow */}
      <div className="">
        <ArrowRightIcon className="h-4 w-4 text-gray-400 " />
      </div>
      
    

      {/* End Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start border-0 border-b border-gray-300 rounded-none px-0 h-10 font-normal hover:border-gray-400 focus:border-teal-700"
          >
            {dateRange?.to ? format(dateRange.to, "PPP") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
