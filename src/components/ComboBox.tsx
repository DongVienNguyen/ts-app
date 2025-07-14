import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface ComboBoxProps {
  value: string; // This is the actual selected value (e.g., email)
  onChange: (value: string) => void; // Emits the actual selected value (e.g., email)
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

const ComboBox: React.FC<ComboBoxProps> = ({ value, onChange, options, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); // State for the text displayed in the input
  const [filteredOptions, setFilteredOptions] = useState<{ value: string; label: string }[]>(options);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Effect to synchronize inputValue with the label corresponding to the 'value' prop
  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else if (value === '') {
      setInputValue(''); // Clear input if value is empty
    } else {
      // If value doesn't match any option, display the value itself (e.g., if user typed something not in list)
      setInputValue(value);
    }
  }, [value, options]);

  // Effect to update filteredOptions when options prop changes (e.g., data loaded)
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue); // Update display text

    // Filter options based on new input value
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(newInputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
    setIsOpen(true); // Open the dropdown if typing
    setSelectedIndex(-1); // Reset selection
  };

  const handleOptionClick = (option: { value: string; label: string }) => {
    setInputValue(option.label); // Display the label in the input
    onChange(option.value); // Emit the actual value (email) to the parent
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
        } else if (filteredOptions.length > 0 && inputValue.trim() !== '') {
          // If no item is explicitly selected but user pressed Enter with text,
          // try to find a match or select the first filtered option.
          const exactMatch = filteredOptions.find(opt => opt.label.toLowerCase() === inputValue.toLowerCase());
          if (exactMatch) {
            handleOptionClick(exactMatch);
          } else {
            handleOptionClick(filteredOptions[0]);
          }
        } else {
            // If Enter is pressed on an empty input or no filtered options, just close.
            setIsOpen(false);
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
    // When focused, show all options initially
    setFilteredOptions(options); 
  };

  const handleBlur = () => {
    // Delay closing to allow option clicks
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
      // On blur, if inputValue doesn't match a label for the current 'value' prop,
      // revert inputValue to the correct label or clear it.
      const selectedOption = options.find(option => option.value === value);
      if (selectedOption && inputValue !== selectedOption.label) {
        setInputValue(selectedOption.label);
      } else if (!selectedOption && inputValue !== '') {
        // If no option is selected (value is empty) but inputValue has text, clear inputValue
        setInputValue('');
      }
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue} // Use inputValue for display
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
              key={option.value}
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