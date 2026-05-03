import React, { useState, useRef, useEffect, useMemo } from "react";
import "./MultiSelect.css";

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  const toggleOption = (value: string | number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeTag = (e: React.MouseEvent, value: string | number) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return selected.map((v) => ({ value: v, label: map.get(v) ?? String(v) }));
  }, [options, selected]);

  return (
    <div className={`multiselect ${open ? "open" : ""}`} ref={containerRef}>
      <div
        className="multiselect-trigger"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        {selectedLabels.length === 0 ? (
          <span className="multiselect-placeholder">{placeholder}</span>
        ) : (
          <div className="multiselect-tags">
            {selectedLabels.map((item) => (
              <span key={item.value} className="multiselect-tag">
                {item.label}
                <button
                  type="button"
                  className="multiselect-tag-remove"
                  onClick={(e) => removeTag(e, item.value)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <span className="multiselect-chevron">▼</span>
      </div>

      {open && (
        <div className="multiselect-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="multiselect-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          {filtered.length === 0 ? (
            <div className="multiselect-empty">No options found</div>
          ) : (
            filtered.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`multiselect-option ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    className="multiselect-checkbox"
                    checked={isSelected}
                    readOnly
                    aria-label={option.label}
                  />
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
