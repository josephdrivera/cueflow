"use client"

import * as Dialog from '@radix-ui/react-dialog';
import { Cue, NewCue } from '../types/cue';
import { useState, useEffect } from 'react';
import { generateNextCueNumber, validateCueNumber } from '../utils/cueNumbering';
import { checkDuplicateCueNumber } from '../services/cueService';
import { TimeInput } from './TimeInput';
import { RunTimeInput } from './RunTimeInput';

interface CueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cue: Cue | Omit<NewCue, 'cue_number'>) => void;
  initialData?: Cue;
  mode: 'add' | 'edit';
  cues: Cue[];
  currentIndex?: number;
  showId: string;
}

export function CueModal({ isOpen, onClose, onSubmit, initialData, mode, cues, currentIndex, showId }: CueModalProps) {
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Cue>>(() => {
    if (initialData) {
      return {
        ...initialData,
        display_id: initialData.cue_number,
      };
    }
    
    // Get the current time in HH:MM AM/PM format
    const now = new Date('2025-01-15T11:26:00-05:00'); // Using the provided time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const startTime = `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    return {
      cue_number: generateNextCueNumber(cues, currentIndex),
      display_id: generateNextCueNumber(cues, currentIndex),
      start_time: startTime,
      run_time: '00:05',  // Default 5 minutes
      end_time: startTime,  // Default to same as start time
      activity: '',
      graphics: '',
      video: '',
      audio: '',
      lighting: '',
      notes: '',
    };
  });

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Mount effect should be first
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update formData when initialData or mode changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        display_id: initialData.cue_number,
      });
    } else if (mode === 'add') {
      setFormData(prev => ({
        ...prev,
        cue_number: generateNextCueNumber(cues, currentIndex),
        display_id: generateNextCueNumber(cues, currentIndex),
      }));
    }
  }, [initialData, mode, cues, currentIndex]);

  // Helper function to format time values
  const formatTimeValue = (value: string | null, isRunTime: boolean = false): string | null => {
    if (!value || value.trim() === '') {
      throw new Error(`Time field cannot be empty`);
    }
    
    try {
      if (isRunTime) {
        // For run time, parse HH:MM format
        const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
          throw new Error(`Run time must be in HH:MM format (e.g., 01:30)`);
        }
        
        const [_, hours, minutes] = match;
        const hrs = parseInt(hours);
        const mins = parseInt(minutes);
        
        if (isNaN(hrs) || hrs < 0 || hrs > 23) {
          throw new Error(`Run time hours must be between 00 and 23`);
        }
        if (isNaN(mins) || mins < 0 || mins > 59) {
          throw new Error(`Run time minutes must be between 00 and 59`);
        }
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
      } else {
        // For start/end times, parse HH:MM AM/PM format
        const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) {
          throw new Error(`Start/End time must be in HH:MM AM/PM format (e.g., 09:30 AM)`);
        }
        
        let [_, hours, minutes, period] = match;
        let hour24 = parseInt(hours);
        const mins = parseInt(minutes);
        
        // Validate hour range (1-12 for 12-hour format)
        if (hour24 < 1 || hour24 > 12) {
          throw new Error(`Hours must be between 1 and 12 for AM/PM format`);
        }
        
        // Convert to 24-hour format
        if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
        if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
        
        if (mins < 0 || mins > 59) {
          throw new Error(`Minutes must be between 00 and 59`);
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;  // Re-throw validation errors
      }
      throw new Error(`Invalid time format`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format and validate the cue number
      const rawCueNumber = formData.display_id?.toString() || 'A001';
      const formattedCueNumber = rawCueNumber.replace(/^([A-Z])(\d+)([a-z])?$/, (_, prefix, num, suffix) => {
        // Ensure exactly 3 digits
        const paddedNum = num.padStart(3, '0');
        if (paddedNum.length > 3) {
          throw new Error(`Invalid cue number format. Number part must be exactly 3 digits (e.g., A001, B123, C001a)`);
        }
        return `${prefix}${paddedNum}${suffix || ''}`;
      });

      if (!validateCueNumber(formattedCueNumber)) {
        throw new Error(`Invalid cue number format. Must be a letter followed by exactly 3 digits, with an optional lowercase letter (e.g., A001, B123, C001a)`);
      }

      // Check for duplicate cue number
      const isDuplicate = await checkDuplicateCueNumber(
        showId,
        formattedCueNumber,
        initialData?.id
      );

      if (isDuplicate) {
        setShowDuplicateDialog(true);
        return;
      }

      // Format all time values
      try {
        const formattedStartTime = formatTimeValue(formData.start_time);
        const formattedRunTime = formatTimeValue(formData.run_time, true);
        const formattedEndTime = formatTimeValue(formData.end_time);

        if (!formattedStartTime || !formattedRunTime || !formattedEndTime) {
          throw new Error('All time fields are required. Use HH:MM format for run time (e.g., 01:30) and HH:MM AM/PM format for start/end times (e.g., 09:30 AM).');
        }

        // Prepare submission data with formatted values
        const submissionData = {
          ...formData,
          show_id: showId,
          cue_number: formattedCueNumber,
          display_id: formData.display_id || formattedCueNumber,
          start_time: formattedStartTime,
          run_time: formattedRunTime,
          end_time: formattedEndTime
        };

        onSubmit(submissionData);
        onClose();
      } catch (error) {
        console.error('Error submitting cue:', error);
        // Show error to user
        alert(error instanceof Error ? error.message : 'An error occurred while submitting the cue');
      }
    } catch (error) {
      console.error('Error submitting cue:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'An error occurred while submitting the cue');
    }
  };

  const handleDuplicateUpdate = async () => {
    try {
      // Find the existing cue with the same number
      const existingCue = cues.find(cue => cue.cue_number === formData.display_id);
      
      if (!existingCue) {
        console.error('Could not find existing cue to update');
        return;
      }

      // Prepare update data with the existing cue's ID
      const updateData = {
        ...formData,
        id: existingCue.id,
        show_id: showId,
        cue_number: formData.display_id,
        display_id: formData.display_id
      };

      onSubmit(updateData);
      setShowDuplicateDialog(false);
      onClose();
    } catch (error) {
      console.error('Error updating existing cue:', error);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  {mode === 'add' ? 'Add New Cue' : 'Edit Cue'}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="display_id" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Cue ID
                    </label>
                    <input
                      type="text"
                      id="display_id"
                      name="display_id"
                      value={formData.display_id || ''}
                      onChange={(e) => handleInputChange('display_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                      placeholder="Enter Cue ID"
                    />
                  </div>

                  <div>
                    <label htmlFor="run_time" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Run Time
                    </label>
                    <RunTimeInput
                      id="run_time"
                      label=""
                      value={formData.run_time || ''}
                      onChange={(value) => handleInputChange('run_time', value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <TimeInput
                    id="start_time"
                    label="Start Time"
                    value={formData.start_time || ''}
                    onChange={(value) => handleInputChange('start_time', value)}
                  />

                  <TimeInput
                    id="end_time"
                    label="End Time"
                    value={formData.end_time || ''}
                    onChange={(value) => handleInputChange('end_time', value)}
                  />
                </div>

                <div>
                  <label htmlFor="activity" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Activity
                  </label>
                  <input
                    type="text"
                    id="activity"
                    name="activity"
                    value={formData.activity || ''}
                    onChange={(e) => handleInputChange('activity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                    placeholder="Enter Activity"
                  />
                </div>

                <div>
                  <label htmlFor="graphics" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Graphics
                  </label>
                  <input
                    type="text"
                    id="graphics"
                    name="graphics"
                    value={formData.graphics || ''}
                    onChange={(e) => handleInputChange('graphics', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                    placeholder="Enter Graphics"
                  />
                </div>

                <div>
                  <label htmlFor="video" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Video
                  </label>
                  <input
                    type="text"
                    id="video"
                    name="video"
                    value={formData.video || ''}
                    onChange={(e) => handleInputChange('video', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                    placeholder="Enter Video"
                  />
                </div>

                <div>
                  <label htmlFor="audio" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Audio
                  </label>
                  <input
                    type="text"
                    id="audio"
                    name="audio"
                    value={formData.audio || ''}
                    onChange={(e) => handleInputChange('audio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                    placeholder="Enter Audio"
                  />
                </div>

                <div>
                  <label htmlFor="lighting" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Lighting
                  </label>
                  <input
                    type="text"
                    id="lighting"
                    name="lighting"
                    value={formData.lighting || ''}
                    onChange={(e) => handleInputChange('lighting', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500"
                    placeholder="Enter Lighting"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500 min-h-[100px]"
                    placeholder="Enter Notes"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 dark:bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  Submit
                </button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 p-6 w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Duplicate Cue Number
            </Dialog.Title>
            <Dialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
              Cue number {formData.display_id} is already in use. Would you like to update the existing cue?
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="px-4 py-2 text-sm font-medium rounded-md btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateUpdate}
                className="px-4 py-2 text-sm font-medium rounded-md btn-primary"
              >
                Update Existing
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
