"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  size?: "sm" | "md" | "lg";
  variant?: "white" | "slate";
  align?: "left" | "right";
  direction?: "down" | "up" | "auto";
  portal?: boolean;
  className?: string;
  dropdownClassName?: string;
  triggerClassName?: string;
  name?: string;
  id?: string;
  prefixIcon?: string;
}

interface DropdownCoords {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  size = "md",
  variant = "white",
  align = "left",
  direction = "auto",
  portal = true,
  className = "",
  dropdownClassName = "",
  triggerClassName = "",
  name,
  id,
  prefixIcon,
}: CustomSelectProps) {
  const autoId = useId();
  const selectId = id || autoId;

  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [coords, setCoords] = useState<DropdownCoords | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value),
  );

  // Compute dynamic position and placement (top vs bottom)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) return;

    // Close if scrolled completely offscreen
    if (rect.bottom < -60 || rect.top > window.innerHeight + 60) {
      setIsOpen(false);
      return;
    }

    const GAP = 6;
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    let chosenPlacement: "top" | "bottom";
    if (direction === "up") {
      chosenPlacement = "top";
    } else if (direction === "down") {
      chosenPlacement = "bottom";
    } else {
      // 'auto': if space below is cramped (< 220px) and space above offers more room, open upwards!
      chosenPlacement =
        spaceBelow < 220 && spaceAbove > spaceBelow ? "top" : "bottom";
    }

    setPlacement(chosenPlacement);

    const availableHeight =
      chosenPlacement === "top" ? spaceAbove - 12 : spaceBelow - 12;
    const maxHeight = Math.min(280, Math.max(120, availableHeight));

    const width = rect.width;
    const screenMargin = 8;
    let left = rect.left;
    if (align === "right") {
      left = rect.right - width;
    }
    // Clamp horizontally to avoid viewport overflow
    left = Math.max(
      screenMargin,
      Math.min(left, window.innerWidth - width - screenMargin),
    );

    setCoords({
      left,
      width,
      maxHeight,
      placement: chosenPlacement,
      top: chosenPlacement === "bottom" ? rect.bottom + GAP : undefined,
      bottom:
        chosenPlacement === "top"
          ? window.innerHeight - rect.top + GAP
          : undefined,
    });
  }, [direction, align]);

  // Position listeners on open, scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    const handleScroll = (e: Event) => {
      // Do not reposition if scrolling inside the dropdown itself
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(e.target as Node)
      ) {
        return;
      }
      updatePosition();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Sync highlighted item with selection on open
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = normalizedOptions.findIndex(
        (opt) => value !== undefined && String(opt.value) === String(value),
      );
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, value, normalizedOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current && highlightedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('[role="option"]');
      const item = items[highlightedIndex] as HTMLElement | undefined;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        updatePosition();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (
          next < normalizedOptions.length &&
          normalizedOptions[next].disabled
        ) {
          next++;
        }
        return next < normalizedOptions.length ? next : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && normalizedOptions[next].disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < normalizedOptions.length
      ) {
        const opt = normalizedOptions[highlightedIndex];
        if (!opt.disabled) {
          onChange(String(opt.value));
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Size specific styling
  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs rounded-lg gap-2",
    md: "py-2.5 px-3.5 text-xs sm:text-sm rounded-xl gap-2.5",
    lg: "py-3 px-4 text-sm rounded-xl gap-3",
  }[size];

  // Variant specific styling
  const variantClasses = {
    white: "bg-white text-navy border-gray-200",
    slate: "bg-slate-50 text-navy border-gray-200 focus:bg-white",
  }[variant];

  const hasValue = selectedOption !== undefined && selectedOption.value !== "";

  // Dropdown panel content
  const dropdownContent = (
    <div
      ref={dropdownRef}
      role="listbox"
      id={`${selectId}-listbox`}
      style={
        portal && coords
          ? {
              position: "fixed",
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 99999,
              ...(coords.top !== undefined ? { top: `${coords.top}px` } : {}),
              ...(coords.bottom !== undefined
                ? { bottom: `${coords.bottom}px` }
                : {}),
            }
          : undefined
      }
      className={`bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden py-1 text-xs overflow-y-auto ${
        portal
          ? coords?.placement === "top"
            ? "animate-in fade-in-0 zoom-in-95 origin-bottom"
            : "animate-in fade-in-0 zoom-in-95 origin-top"
          : `absolute ${
              placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } ${
              align === "right" ? "right-0" : "left-0"
            } min-w-full w-max max-w-xs sm:max-w-md z-50 max-h-60 animate-fadeIn`
      } ${dropdownClassName}`}
    >
      {normalizedOptions.map((opt, idx) => {
        const isSelected =
          value !== undefined && String(opt.value) === String(value);
        const isHighlighted = idx === highlightedIndex;

        return (
          <button
            key={String(opt.value)}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={opt.disabled}
            onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
            onClick={() => {
              if (!opt.disabled) {
                onChange(String(opt.value));
                setIsOpen(false);
                triggerRef.current?.focus();
              }
            }}
            className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between cursor-pointer ${
              isSelected
                ? "text-navy font-bold bg-blue-50/80 text-blue-900"
                : isHighlighted
                  ? "bg-slate-100 text-navy font-semibold"
                  : "text-gray-700 hover:text-navy hover:bg-slate-50"
            } ${
              opt.disabled
                ? "opacity-40 cursor-not-allowed hover:bg-transparent"
                : ""
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
  );

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
          value={value !== undefined ? String(value) : ""}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${selectId}-listbox`}
        className={`w-full flex items-center justify-between border transition-all text-left shadow-2xs cursor-pointer ${sizeClasses} ${variantClasses} ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-100 hover:border-gray-200"
            : isOpen
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : error
                ? "border-red-400 bg-red-50/20 hover:border-red-500"
                : "hover:border-blue-400 hover:text-navy"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedOption?.icon ? (
            <span className="material-symbols-outlined text-base! text-gray-500 shrink-0">
              {selectedOption.icon}
            </span>
          ) : prefixIcon ? (
            <span className="material-symbols-outlined text-base! text-gray-400 shrink-0">
              {prefixIcon}
            </span>
          ) : null}
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

        <span
          className={`material-symbols-outlined text-gray-400 text-sm! shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? (placement === "top" ? "rotate-180" : "rotate-180") : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Menu Panel (Portaled to document.body by default or rendered locally) */}
      {isOpen &&
        (portal && isMounted && typeof document !== "undefined"
          ? createPortal(dropdownContent, document.body)
          : dropdownContent)}
    </div>
  );
}
