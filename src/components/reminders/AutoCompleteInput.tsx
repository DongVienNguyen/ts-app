import React from 'react';
import ComboBox from '@/components/ComboBox'; // Assuming ComboBox is in src/components

interface AutoCompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: { value: string; label: string }[]; // Changed to array of objects
  placeholder?: string;
  className?: string;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}) => {
  return (
    <ComboBox
      value={value}
      onChange={onChange}
      options={suggestions}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default AutoCompleteInput;