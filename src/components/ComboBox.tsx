"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboBoxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ComboBox = React.forwardRef<HTMLButtonElement, ComboBoxProps>(
  ({ options, value, onChange, placeholder, className }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')

    const filteredOptions = React.useMemo(() =>
      search === ''
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(search.toLowerCase())
          ),
      [options, search]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab' && open && filteredOptions.length > 0) {
        onChange(filteredOptions[0].value)
        setOpen(false)
      }
    }

    const handleSelect = (currentValue: string) => {
      onChange(currentValue === value ? "" : currentValue)
      setOpen(false)
      setSearch('')
    }

    return (
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearch('');
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder || "Select an option..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput
              placeholder="Search..."
              value={search}
              onValueChange={setSearch}
              onKeyDown={handleKeyDown}
            />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {filteredOptions.map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)
ComboBox.displayName = "ComboBox"

export default ComboBox