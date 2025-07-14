import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface AutoCompleteInputProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onTabSelect?: () => void;
  suggestions: { value: string; label: string }[];
}

const AutoCompleteInput = forwardRef<HTMLInputElement, AutoCompleteInputProps>(({
  value,
  onChange,
  onTabSelect,
  suggestions,
  className,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!);

  const filteredSuggestions = React.useMemo(() =>
    value
      ? suggestions.filter(s => s.label.toLowerCase().includes(value.toLowerCase()))
      : suggestions,
    [suggestions, value]
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    inputRef.current?.blur();
    if (onTabSelect) {
      onTabSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && open && filteredSuggestions.length > 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[0].value);
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn("w-full", className)}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0" 
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {filteredSuggestions.map((suggestion, index) => (
                <CommandItem
                  key={`${suggestion.value}-${index}`}
                  value={suggestion.value}
                  onSelect={() => handleSelect(suggestion.value)}
                >
                  {suggestion.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredSuggestions.length === 0 && value && <CommandEmpty>Không tìm thấy.</CommandEmpty>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

AutoCompleteInput.displayName = 'AutoCompleteInput';

export default AutoCompleteInput;