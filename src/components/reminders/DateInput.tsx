import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ value, onChange, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^0-9]/g, '');
    if (inputValue.length > 4) {
      inputValue = inputValue.slice(0, 4);
    }
    if (value.length < inputValue.length && inputValue.length === 2) {
      inputValue = `${inputValue}-`;
    }
    if (inputValue.length > 2 && !inputValue.includes('-')) {
        inputValue = `${inputValue.slice(0, 2)}-${inputValue.slice(2)}`;
    }
    onChange(inputValue);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="dd-MM"
      maxLength={5}
      {...props}
    />
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;