import React, { forwardRef } from 'react';
import ComboBox from '@/components/ComboBox'; // Assuming ComboBox is in src/components

interface AutoCompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onTabSelect?: () => void;
  suggestions: { value: string; label: string }[]; // Changed to array of objects
  placeholder?: string;
  className?: string;
}

const AutoCompleteInput = forwardRef<HTMLButtonElement, AutoCompleteInputProps>(({
  value,
  onChange,
  onTabSelect,
  suggestions,
  placeholder,
  className,
}, ref) => {
  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (onTabSelect) {
      onTabSelect();
    }
  };

  return (
    <ComboBox
      ref={ref}
      value={value}
      onChange={handleChange}
      options={suggestions}
      placeholder={placeholder}
      className={className}
    />
  );
});

AutoCompleteInput.displayName = 'AutoCompleteInput';

export default AutoCompleteInput;