import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface DateInputProps {
  value: string; // Expected format: YYYY-MM-DD
  onChange: (value: string) => void; // Returns format: YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabledBefore?: Date; // Prop to disable past dates
  label?: string; // Label prop
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, placeholder, className, disabledBefore, label }) => {
  const [open, setOpen] = useState(false);
  
  // Convert YYYY-MM-DD string to Date object for react-day-picker
  const selectedDate = value ? (isValid(parseISO(value)) ? parseISO(value) : undefined) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    // If a date is selected, format it to YYYY-MM-DD string and pass to onChange
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      // If date is undefined (e.g., user clears selection), set the value to an empty string
      onChange(''); 
    }
    setOpen(false); // Close popover after selection
  };

  // Display value in dd/MM/yyyy format
  const displayValue = value && isValid(parseISO(value)) ? format(parseISO(value), "dd/MM/yyyy") : (placeholder || "dd/MM/yyyy");

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabledBefore ? { before: disabledBefore } : undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateInput;