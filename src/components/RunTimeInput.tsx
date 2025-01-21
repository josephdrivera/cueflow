"use client"

import { useState, useEffect, useRef } from 'react';

interface RunTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

export function RunTimeInput({ value, onChange, label, id }: RunTimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parts = value.split(':');
        if (parts.length >= 2) {
          const [hours, minutes] = parts;
          if (hours) setSelectedHour(hours.padStart(2, '0'));
          if (minutes) setSelectedMinute(minutes.padStart(2, '0'));
        }
      } catch (error) {
        console.error('Error parsing time:', error);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );
  
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  const handleTimeSelection = (type: 'hour' | 'minute', value: string) => {
    if (type === 'hour') {
      setSelectedHour(value);
    } else if (type === 'minute') {
      setSelectedMinute(value);
    }

    // Return in HH:MM format
    const newHour = type === 'hour' ? value : selectedHour;
    const newMinute = type === 'minute' ? value : selectedMinute;
    onChange(`${newHour}:${newMinute}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          id={id}
          readOnly
          value={`${selectedHour}:${selectedMinute}`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer dark:placeholder-gray-500"
          placeholder="--:--"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg">
          <div className="p-2 grid grid-cols-2 gap-1">
            <div className="space-y-1 h-48 overflow-y-auto">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hour</div>
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeSelection('hour', hour)}
                  className={`w-full px-2 py-1 text-sm rounded-md ${
                    selectedHour === hour
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {hour}
                </button>
              ))}
            </div>

            <div className="space-y-1 h-48 overflow-y-auto">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Minute</div>
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleTimeSelection('minute', minute)}
                  className={`w-full px-2 py-1 text-sm rounded-md ${
                    selectedMinute === minute
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
