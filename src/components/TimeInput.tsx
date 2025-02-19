"use client"

import { useState, useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

export function TimeInput({ value, onChange, label, id }: TimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value && value.trim()) {
      try {
        // Try parsing HH:MM AM/PM format
        const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
          const [_, hours, minutes, period] = match;
          if (hours && minutes) {
            let hour12 = parseInt(hours);
            if (hour12 === 0) hour12 = 12;
            if (hour12 > 12) hour12 = hour12 % 12 || 12;
            
            setSelectedHour(hour12.toString().padStart(2, '0'));
            setSelectedMinute(minutes.padStart(2, '0'));
            setSelectedPeriod(period?.toUpperCase() || 'AM');
            return;
          }
        }

        // If that fails, try parsing 24-hour format
        const timeParts = value.split(':');
        if (timeParts.length === 2) {
          const [hours, minutes] = timeParts;
          if (hours && minutes) {
            const hour24 = parseInt(hours);
            if (hour24 >= 0 && hour24 <= 23) {
              let hour12 = hour24 % 12;
              hour12 = hour12 === 0 ? 12 : hour12;
              setSelectedHour(hour12.toString().padStart(2, '0'));
              setSelectedMinute(minutes.padStart(2, '0'));
              setSelectedPeriod(hour24 >= 12 ? 'PM' : 'AM');
            }
          }
        }
      } catch (error) {
        console.error('Error parsing time:', error);
        // Set default values on error
        setSelectedHour('12');
        setSelectedMinute('00');
        setSelectedPeriod('AM');
      }
    } else {
      // Reset state for empty value
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('AM');
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

  const hours = Array.from({ length: 12 }, (_, i) => 
    (i === 0 ? 12 : i).toString().padStart(2, '0')
  );
  
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  const handleTimeSelection = (type: 'hour' | 'minute' | 'period', value: string) => {
    let h = selectedHour;
    let m = selectedMinute;
    let p = selectedPeriod;

    switch (type) {
      case 'hour':
        h = value;
        setSelectedHour(value);
        break;
      case 'minute':
        m = value;
        setSelectedMinute(value);
        break;
      case 'period':
        p = value;
        setSelectedPeriod(value);
        break;
    }

    // Ensure hour is in 12-hour format for display (01-12)
    let hour12 = parseInt(h || '12');
    if (hour12 === 0) hour12 = 12;
    if (hour12 > 12) hour12 = hour12 % 12 || 12;
    h = hour12.toString().padStart(2, '0');

    // Ensure minute is padded
    m = (m || '00').padStart(2, '0');
    
    // Ensure period is either AM or PM
    p = (p || 'AM').toUpperCase();
    
    // Store display value in HH:MM AM/PM format
    const displayTime = `${h}:${m} ${p}`;
    onChange(displayTime);
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
          value={selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute} ${selectedPeriod}` : ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer dark:placeholder-gray-500"
          placeholder="--:-- --"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg">
          <div className="grid grid-cols-3 gap-1 p-2">
            <div className="space-y-1">
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

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Minute</div>
              <div className="max-h-[200px] overflow-y-auto">
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

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Period</div>
              {['AM', 'PM'].map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeSelection('period', period)}
                  className={`w-full px-2 py-1 text-sm rounded-md ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
