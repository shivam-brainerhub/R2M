"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { PropertyItem } from '@/lib/api';

interface PropertyComboboxProps {
  value: string;
  propertyId?: number;
  onChange: (name: string, propertyId?: number) => void;
  availableProperties: PropertyItem[];
  excludeNames?: string[];
  onCreateProperty?: (name: string) => Promise<PropertyItem | null>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PropertyCombobox({
  value,
  propertyId,
  onChange,
  availableProperties,
  excludeNames = [],
  onCreateProperty,
  placeholder = 'Select or create property...',
  disabled = false,
  className = '',
}: PropertyComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external value changes to local input display
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If user typed something without selecting or creating, revert to current value
        if (query.trim() !== (value || '').trim()) {
          const exactMatch = availableProperties.find(
            (p) => p.name.trim().toLowerCase() === query.trim().toLowerCase()
          );
          if (exactMatch) {
            onChange(exactMatch.name, exactMatch.id);
            setQuery(exactMatch.name);
          } else {
            setQuery(value || '');
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, query, value, availableProperties, onChange]);

  // Filtered properties based on user query
  const trimmedQuery = query.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    if (!trimmedQuery) return availableProperties;
    return availableProperties.filter((p) =>
      p.name.toLowerCase().includes(trimmedQuery)
    );
  }, [availableProperties, trimmedQuery]);

  // Check if query is an exact match for an existing property
  const hasExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return availableProperties.some(
      (p) => p.name.trim().toLowerCase() === trimmedQuery
    );
  }, [availableProperties, trimmedQuery]);

  const canCreate = !!trimmedQuery && !hasExactMatch;

  // Build full navigable items list
  // 0 .. filteredProperties.length - 1: properties
  // filteredProperties.length (if canCreate): the "Create" button
  const totalNavItems = filteredProperties.length + (canCreate ? 1 : 0);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-combobox-item]');
      const activeEl = items[highlightedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectProperty = (prop: PropertyItem) => {
    const isExcluded = excludeNames.some(
      (ex) => ex.toLowerCase() === prop.name.toLowerCase() && ex.toLowerCase() !== (value || '').toLowerCase()
    );
    if (isExcluded) return;

    onChange(prop.name, prop.id);
    setQuery(prop.name);
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    const cleanName = query.trim();
    if (!cleanName || isCreating) return;

    setIsCreating(true);
    try {
      if (onCreateProperty) {
        const created = await onCreateProperty(cleanName);
        if (created) {
          onChange(created.name, created.id);
          setQuery(created.name);
        } else {
          onChange(cleanName);
          setQuery(cleanName);
        }
      } else {
        onChange(cleanName);
        setQuery(cleanName);
      }
      setIsOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (totalNavItems > 0 ? (prev + 1) % totalNavItems : -1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          totalNavItems > 0 ? (prev - 1 + totalNavItems) % totalNavItems : -1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredProperties.length) {
          handleSelectProperty(filteredProperties[highlightedIndex]);
        } else if (highlightedIndex === filteredProperties.length && canCreate) {
          handleCreateNew();
        } else if (canCreate && filteredProperties.length === 0) {
          handleCreateNew();
        } else if (filteredProperties.length === 1) {
          handleSelectProperty(filteredProperties[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery(value || '');
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
            inputRef.current?.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-3 pr-14 py-1.5 text-xs bg-white border rounded-lg outline-none transition-all ${
            disabled
              ? 'bg-slate-100 text-gray-400 cursor-not-allowed border-gray-200'
              : isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 text-navy font-semibold'
              : 'border-gray-200 text-navy hover:border-gray-300 focus:border-blue-500'
          }`}
        />

        {/* Action icons right: Clear button & Dropdown toggle arrow */}
        <div className="absolute right-1.5 flex items-center gap-0.5 text-gray-400">
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              className="p-1 hover:text-gray-600 rounded transition-colors cursor-pointer"
              title="Clear selection"
            >
              <span className="material-symbols-outlined text-xs! block">close</span>
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                inputRef.current?.focus();
              }
            }}
            className="p-1 hover:text-navy rounded transition-colors cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-sm! block transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full mt-1 w-full min-w-[240px] max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1 text-xs max-h-60 overflow-y-auto animate-fadeIn"
        >
          {/* Header indicator when filtering */}
          {trimmedQuery && (
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-gray-100 flex items-center justify-between">
              <span>Matching Properties</span>
              <span>{filteredProperties.length} found</span>
            </div>
          )}

          {/* Filtered Existing Properties */}
          {filteredProperties.length > 0 ? (
            filteredProperties.map((prop, idx) => {
              const isSelected =
                (propertyId && prop.id === propertyId) ||
                prop.name.toLowerCase() === (value || '').toLowerCase();

              const isExcluded = excludeNames.some(
                (ex) =>
                  ex.toLowerCase() === prop.name.toLowerCase() &&
                  ex.toLowerCase() !== (value || '').toLowerCase()
              );

              const isHighlighted = highlightedIndex === idx;

              return (
                <button
                  key={prop.id}
                  type="button"
                  data-combobox-item
                  role="option"
                  aria-selected={isSelected}
                  disabled={isExcluded}
                  onClick={() => handleSelectProperty(prop)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                    isExcluded
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 text-gray-400'
                      : isHighlighted
                      ? 'bg-blue-50 text-blue-900 font-medium'
                      : isSelected
                      ? 'bg-light-blue/40 text-navy font-bold'
                      : 'text-gray-700 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2 truncate">
                    <span className="material-symbols-outlined text-sm! text-gray-400 shrink-0">
                      tune
                    </span>
                    <span className="truncate">{prop.name}</span>
                    {prop.group && (
                      <span className="text-[10px] text-gray-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {prop.group}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isExcluded && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Already added
                      </span>
                    )}
                    {isSelected && !isExcluded && (
                      <span className="material-symbols-outlined text-sm! text-blue-600">
                        check
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : !canCreate ? (
            <div className="px-3 py-4 text-center text-xs text-gray-400">
              No matching specifications found
            </div>
          ) : null}

          {/* Creatable Option */}
          {canCreate && (
            <button
              type="button"
              data-combobox-item
              disabled={isCreating}
              onClick={handleCreateNew}
              onMouseEnter={() => setHighlightedIndex(filteredProperties.length)}
              className={`w-full text-left px-3 py-2.5 border-t border-blue-100 flex items-center justify-between transition-colors cursor-pointer ${
                highlightedIndex === filteredProperties.length
                  ? 'bg-blue-100/70 text-blue-900'
                  : 'bg-blue-50/70 text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                {isCreating ? (
                  <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-base! text-blue-600 shrink-0">
                    add_circle
                  </span>
                )}
                <span className="truncate font-bold text-xs">
                  {isCreating ? 'Creating property...' : `Create "${query.trim()}"`}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-blue-600/80 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                New Property
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
