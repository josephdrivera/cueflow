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
        cue_number: formData.display_id
      };

      onSubmit(submissionData);
      onClose();
    } catch (error) {
      console.error('Error checking for duplicate cue:', error);
      // You might want to show an error message to the user here
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
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
                  className="input-primary w-full"
                />
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline px-4 py-2 text-sm font-medium rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-sm font-medium rounded-md"
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <Dialog.Title className="text-lg font-semibold mb-2">
              Duplicate Cue Number
            </Dialog.Title>
            <Dialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
              Cue number {formData.display_id} is already in use. Would you like to update the existing cue?
            </Dialog.Description>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="btn-outline px-4 py-2 text-sm font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateUpdate}
                className="btn-primary px-4 py-2 text-sm font-medium rounded-md"
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
