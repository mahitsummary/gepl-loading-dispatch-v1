'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const AutoComplete = ({
  options = [],
  value = null,
  onChange,
  placeholder = 'Search...',
  displayKey = 'name',
  valueKey = 'id',
  isLoading = false,
  onSearch = null,
  label = '',
  error = '',
  required = false,
  disabled = false,
  clearable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (onSearch && searchValue) {
      onSearch(searchValue);
    } else {
      setFilteredOptions(
        options.filter((option) =>
          String(option[displayKey])
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        )
      );
    }
  }, [searchValue, options, displayKey, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = value
    ? options.find((o) => o[valueKey] === value)
    : null;

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchValue('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`relative border rounded-lg bg-white transition-all ${
          error
            ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500'
            : 'border-secondary-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500'
        } ${disabled ? 'bg-secondary-100 opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchValue : selectedOption ? selectedOption[displayKey] : ''}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOption ? '' : placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 bg-transparent focus:outline-none text-sm"
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {selectedOption && clearable && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-secondary-500 transition-transform pointer-events-none ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-secondary-500 text-sm">
              Loading...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option[valueKey]}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors ${
                  value === option[valueKey]
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-secondary-700'
                }`}
              >
                {option[displayKey]}
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-secondary-500 text-sm">
              No options found
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default AutoComplete;
