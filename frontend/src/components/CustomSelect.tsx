"use client";

import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface CustomSelectProps {
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'white' | 'slate';
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  className?: string;
  dropdownClassName?: string;
  triggerClassName?: string;
  name?: string;
  id?: string;
  prefixIcon?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  size = 'md',
  variant = 'white',
  align = 'left',
  direction = 'down',
  className = '',
  dropdownClassName = '',
  triggerClassName = '',
  name,
  id,
  prefixIcon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Size specific styling
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-lg gap-2',
    md: 'py-2.5 px-3.5 text-xs sm:text-sm rounded-xl gap-2.5',
    lg: 'py-3 px-4 text-sm rounded-xl gap-3',
  }[size];

  // Variant specific styling
  const variantClasses = {
    white: 'bg-white text-navy border-gray-200',
    slate: 'bg-slate-50 text-navy border-gray-200 focus:bg-white',
  }[variant];

  const hasValue = selectedOption !== undefined && selectedOption.value !== '';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Hidden input for form support */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value !== undefined ? String(value) : ''}
        />
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between border transition-all text-left shadow-2xs cursor-pointer ${sizeClasses} ${variantClasses} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 hover:border-gray-200'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : error
            ? 'border-red-400 bg-red-50/20 hover:border-red-500'
            : 'hover:border-blue-400 hover:text-navy'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {prefixIcon && (
            <span className="material-symbols-outlined text-base! text-gray-400 shrink-0">
              {prefixIcon}
            </span>
          )}
          {hasValue ? (
            <span className="font-semibold text-navy truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-gray-400 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <span className="material-symbols-outlined text-gray-400 text-sm! shrink-0 ml-1.5 transition-transform duration-200">
          {isOpen
            ? direction === 'up'
              ? 'expand_more'
              : 'expand_less'
            : direction === 'up'
            ? 'expand_less'
            : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          } min-w-full w-max max-w-xs sm:max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1 text-xs max-h-60 overflow-y-auto animate-fadeIn ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected =
              value !== undefined && String(opt.value) === String(value);

            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange(String(opt.value));
                    setIsOpen(false);
                  }
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-light-blue transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'text-navy font-bold bg-light-blue/50'
                    : 'text-gray-700 hover:text-navy'
                } ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2 truncate">
                  {opt.icon && (
                    <span className="material-symbols-outlined text-base! text-gray-500 shrink-0">
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <span className="material-symbols-outlined text-sm! text-blue-600 shrink-0 ml-2">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
