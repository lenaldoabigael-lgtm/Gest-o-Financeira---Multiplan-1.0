// components/CurrencyInput.tsx
import React, { useState, useEffect } from 'react';
import { parseBrlMoney, formatBrl } from '../lib/currency';

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (numericValue: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  disabled = false,
  readOnly = false,
  id,
  autoFocus = false
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value !== undefined && value > 0) {
      return formatBrl(value);
    }
    return '';
  });
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value when not actively focused
  useEffect(() => {
    if (!isFocused) {
      if (value !== undefined && value > 0) {
        setDisplayValue(formatBrl(value));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dots, commas, spaces, and minus
    const sanitized = raw.replace(/[^\d., -]/g, '');
    setDisplayValue(sanitized);

    const parsed = parseBrlMoney(sanitized);
    onChange(parsed);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // If value is formatted e.g. "1.575,00", we keep it or show as is for easy editing
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseBrlMoney(displayValue);
    onChange(parsed);
    if (parsed > 0) {
      setDisplayValue(formatBrl(parsed));
    } else {
      setDisplayValue('');
    }
  };

  return (
    <div className={`relative flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-blue-500 transition-all ${disabled || readOnly ? 'bg-slate-100/70 cursor-not-allowed opacity-90' : 'hover:border-slate-300'} ${className}`}>
      <span className="pl-3 pr-1 text-xs font-black text-slate-400 select-none">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full py-2 pr-3 bg-transparent text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal"
      />
    </div>
  );
};
