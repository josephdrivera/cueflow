"use client"

import * as Dialog from '@radix-ui/react-dialog';
import { Cue, NewCue } from '../types/cue';
import { useState, useEffect } from 'react';
import { generateNextCueNumber } from '../utils/cueNumbering';
import { checkDuplicateCueNumber } from '../services/cueService';

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
    return {
      display_id: generateNextCueNumber(cues, currentIndex),
      start_time: '',
      run_time: '',
      end_time: '',
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
        display_id: generateNextCueNumber(cues, currentIndex),
      }));
    }
  }, [initialData, mode, cues, currentIndex]);

  // Helper function to format time values
  const formatTimeValue = (value: string | null): string | null => {
    if (!value) return null;
    
    // If it's already in HH:MM:SS format, return as is
    if (value.includes(':')) return value;
    
    // If it's just a number, assume it's minutes and convert to HH:MM:SS
    const minutes = parseInt(value, 10);
    if (isNaN(minutes)) return null;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Check for duplicate cue number
      const isDuplicate = await checkDuplicateCueNumber(
        showId,
        formData.display_id as string,
        initialData?.id
      );

      if (isDuplicate) {
        setShowDuplicateDialog(true);
        return;
      }

      // If no duplicate, prepare the submission data
      const submissionData = {
        ...formData,
        show_id: showId,
        cue_number: formData.display_id,
        // Format time fields
        start_time: formData.start_time || null,
        run_time: formatTimeValue(formData.run_time),
        end_time: formData.end_time || null
      };

      onSubmit(submissionData);
      onClose();
    } catch (error) {
      console.error('Error checking for duplicate cue:', error);
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
        cue_number: formData.display_id
      };

      onSubmit(updateData);
      setShowDuplicateDialog(false);
      onClose();
    } catch (error) {
      console.error('Error updating existing cue:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="mb-4 text-xl font-bold">
              {mode === 'add' ? 'Add New Cue' : 'Edit Cue'}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="display_id" className="block mb-1 text-sm font-medium">
                  Cue ID
                </label>
                <input
                  type="text"
                  id="display_id"
                  name="display_id"
                  value={formData.display_id || ''}
                  onChange={handleChange}
                  className="w-full input-primary"
                  placeholder="e.g., A101"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="start_time" className="block text-sm font-medium">
                  Start Time
                </label>
                <input
                  type="text"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="run_time" className="block text-sm font-medium">
                  Run Time
                </label>
                <input
                  type="text"
                  id="run_time"
                  name="run_time"
                  value={formData.run_time}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="end_time" className="block text-sm font-medium">
                  End Time
                </label>
                <input
                  type="text"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="activity" className="block text-sm font-medium">
                  Activity
                </label>
                <input
                  type="text"
                  id="activity"
                  name="activity"
                  value={formData.activity}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="graphics" className="block text-sm font-medium">
                  Graphics
                </label>
                <input
                  type="text"
                  id="graphics"
                  name="graphics"
                  value={formData.graphics}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="video" className="block text-sm font-medium">
                  Video
                </label>
                <input
                  type="text"
                  id="video"
                  name="video"
                  value={formData.video}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="audio" className="block text-sm font-medium">
                  Audio
                </label>
                <input
                  type="text"
                  id="audio"
                  name="audio"
                  value={formData.audio}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lighting" className="block text-sm font-medium">
                  Lighting
                </label>
                <input
                  type="text"
                  id="lighting"
                  name="lighting"
                  value={formData.lighting}
                  onChange={handleChange}
                  className="w-full input-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full input-primary"
                />
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-md btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md btn-primary"
                >
                  {mode === 'add' ? 'Add Cue' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 p-6 w-full max-w-md bg-white rounded-lg shadow-lg -translate-x-1/2 -translate-y-1/2 dark:bg-gray-800">
            <Dialog.Title className="mb-2 text-lg font-semibold">
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
