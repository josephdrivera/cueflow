"use client"

import { useState, useEffect } from 'react';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

export function TimePickerInput({ value, onChange, label, id }: TimePickerInputProps) {
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m, s] = value.split(':');
      setHours(h || '00');
      setMinutes(m || '00');
      setSeconds(s || '00');
    }
  }, [value]);

  // Generate options for dropdowns
  const hourOptions = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );
  
  const minuteOptions = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  const secondOptions = minuteOptions; // Same as minutes

  const handleChange = (part: 'hours' | 'minutes' | 'seconds', newValue: string) => {
    let h = hours, m = minutes, s = seconds;
    
    switch (part) {
      case 'hours':
        h = newValue;
        setHours(newValue);
        break;
      case 'minutes':
        m = newValue;
        setMinutes(newValue);
        break;
      case 'seconds':
        s = newValue;
        setSeconds(newValue);
        break;
    }

    onChange(`${h}:${m}:${s}`);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <select
          value={hours}
          onChange={(e) => handleChange('hours', e.target.value)}
          className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {hour}h
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={minutes}
          onChange={(e) => handleChange('minutes', e.target.value)}
          className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {minuteOptions.map((minute) => (
            <option key={minute} value={minute}>
              {minute}m
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={seconds}
          onChange={(e) => handleChange('seconds', e.target.value)}
          className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {secondOptions.map((second) => (
            <option key={second} value={second}>
              {second}s
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
