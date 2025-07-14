import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface ComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[]; // Changed to array of objects
  placeholder?: string;
  className?: string;
}

const ComboBox: React.FC<ComboBoxProps> = ({ value, onChange, options, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<{ value: string; label: string }[]>([]); // Changed type
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase()) // Filter by label
      );
      setFilteredOptions(filtered);
    }
    setSelectedIndex(-1);
  }, [value, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: { value: string; label: string }) => { // Changed type
    onChange(option.label); // Pass label back to onChange
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleOptionClick(filteredOptions[selectedIndex]);
        } else if (filteredOptions.length > 0) {
          // If no item is selected, but there are filtered options, select the first one
          handleOptionClick(filteredOptions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay closing to allow option clicks
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <Card 
          ref={optionsRef}
          className="absolute top-full left-0 right-0 z-50 max-h-60 overflow-y-auto mt-1 border bg-white shadow-lg"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value} // Use option.value as key for uniqueness
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default ComboBox;