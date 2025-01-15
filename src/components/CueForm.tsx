'use client';

import React, { useState } from 'react';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import ThemeRegistry from './ThemeRegistry';
import '@/app/globals.css';
import { formatCueNumber, validateCueNumber } from '@/utils/cueNumbering';
import { createCue } from '@/services/cueService';

const StyledTimePicker = styled(DesktopTimePicker)({
  width: '100%',
  '& .MuiInputBase-root': {
    color: 'white',
    backgroundColor: '#24272e',
    border: '1px solid #2a2d35',
    borderRadius: '0.375rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiIconButton-root': {
    color: 'white',
  },
  '& .MuiClock-root': {
    backgroundColor: '#1e2128',
    color: 'white',
  },
  '& .MuiPickersPopper-root': {
    backgroundColor: '#1e2128',
  },
  '& .MuiPaper-root': {
    backgroundColor: '#1e2128',
    color: 'white',
  },
});

interface CueData {
  cueId: string;
  startTime: string;
  runTime: string;
  endTime: string;
  activity: string;
  graphics: string;
  video: string;
  audio: string;
  lighting: string;
  notes: string;
}

const CueForm: React.FC<{ dayCueListId: string }> = ({ dayCueListId }) => {
  const [cueData, setCueData] = useState<CueData>({
    cueId: '',
    startTime: '',
    runTime: '',
    endTime: '',
    activity: '',
    graphics: '',
    video: '',
    audio: '',
    lighting: '',
    notes: '',
  });
  const [cueIdError, setCueIdError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const presetTimes = Array.from({ length: 60 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i + 1 === 1 ? 'Minute' : 'Minutes'}`
  }));

  const handleTimeChange = (value: dayjs.Dayjs | null, field: 'startTime' | 'endTime') => {
    if (value && value.isValid()) {
      setCueData(prev => ({
        ...prev,
        [field]: value.format('HH:mm')
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cueId') {
      // Clear any previous error
      setCueIdError('');
      
      // Validate cue number format
      if (value && !validateCueNumber(value)) {
        setCueIdError('Invalid format. Must be a letter followed by 3 digits (e.g., A001)');
        
        // Try to format the input if it's close to valid
        const match = value.match(/^([A-Z])(\d+)$/i);
        if (match) {
          const [, letter, number] = match;
          const formattedValue = formatCueNumber(letter.toUpperCase(), parseInt(number));
          setCueData(prev => ({
            ...prev,
            [name]: formattedValue
          }));
          setCueIdError(''); // Clear error if we could fix it
          return;
        }
      }
    } else if (name === 'runTime') {
      const minutes = parseInt(value);
      if (!isNaN(minutes)) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        setCueData(prevState => ({
          ...prevState,
          runTime: formattedTime
        }));
      } else {
        setCueData(prevState => ({
          ...prevState,
          runTime: value
        }));
      }
    } else {
      setCueData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatTimeForDatabase = (time: string): string => {
    // Add :00 seconds to HH:mm time
    return time ? `${time}:00` : '00:00:00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cueIdError) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      // The run time is already in HH:mm format, just need to add seconds
      const formattedRunTime = formatTimeForDatabase(cueData.runTime);

      const newCue = {
        day_cue_list_id: dayCueListId,
        cue_number: cueData.cueId,
        start_time: formatTimeForDatabase(cueData.startTime),
        run_time: formattedRunTime,
        end_time: formatTimeForDatabase(cueData.endTime),
        activity: cueData.activity,
        graphics: cueData.graphics,
        video: cueData.video,
        audio: cueData.audio,
        lighting: cueData.lighting,
        notes: cueData.notes,
      };

      await createCue(newCue);
      
      // Reset form after successful submission
      setCueData({
        cueId: '',
        startTime: '',
        runTime: '',
        endTime: '',
        activity: '',
        graphics: '',
        video: '',
        audio: '',
        lighting: '',
        notes: '',
      });

    } catch (error) {
      console.error('Error creating cue:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create cue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeRegistry>
      <div className="w-full max-w-2xl mx-auto p-6 bg-[#1e2128] rounded-lg">
        <h2 className="mb-6 text-2xl font-semibold text-gray-100">Add New Cue</h2>
        {submitError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cueId" className="text-sm font-medium text-gray-100">
              Cue ID
            </label>
            <input
              type="text"
              id="cueId"
              name="cueId"
              value={cueData.cueId}
              onChange={handleInputChange}
              placeholder="e.g., A001"
              className={`w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                cueIdError ? 'border-red-500' : ''
              }`}
              required
            />
            {cueIdError && (
              <p className="text-sm text-red-500 mt-1">{cueIdError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="startTime" className="text-sm font-medium text-gray-100">
              Start Time
            </label>
            <StyledTimePicker
              value={cueData.startTime ? dayjs(cueData.startTime, 'HH:mm') : null}
              onChange={(newValue) => handleTimeChange(newValue, 'startTime')}
              format="HH:mm"
              ampm={false}
              views={['hours', 'minutes']}
              minutesStep={5}
              slotProps={{
                textField: {
                  required: true,
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="runTime" className="text-sm font-medium text-gray-100">
              Run Time
            </label>
            <select
              id="runTime"
              name="runTime"
              value={cueData.runTime ? parseInt(cueData.runTime.split(':')[0]) * 60 + parseInt(cueData.runTime.split(':')[1]) : ''}
              onChange={handleInputChange}
              className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select duration</option>
              {presetTimes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="endTime" className="text-sm font-medium text-gray-100">
              End Time
            </label>
            <StyledTimePicker
              value={cueData.endTime ? dayjs(cueData.endTime, 'HH:mm') : null}
              onChange={(newValue) => handleTimeChange(newValue, 'endTime')}
              format="HH:mm"
              ampm={false}
              views={['hours', 'minutes']}
              minutesStep={5}
              slotProps={{
                textField: {
                  required: true,
                }
              }}
            />
          </div>

          {['activity', 'graphics', 'video', 'audio', 'lighting'].map((field) => (
            <div key={field} className="space-y-2">
              <label htmlFor={field} className="text-sm font-medium text-gray-100 capitalize">
                {field}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                value={cueData[field]}
                onChange={handleInputChange}
                className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required={field === 'activity'}
              />
            </div>
          ))}

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-100">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={cueData.notes}
              onChange={handleInputChange}
              className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-[#24272e] text-gray-100 hover:bg-[#2a2d35]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(cueIdError)}
              className={`px-4 py-2 text-gray-100 rounded-md ${
                isSubmitting || cueIdError
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Adding...' : 'Add Cue'}
            </button>
          </div>
        </form>
      </div>
    </ThemeRegistry>
  );
};

export default CueForm;
