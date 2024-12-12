"use client"

import * as Dialog from '@radix-ui/react-dialog';
import { Cue, NewCue } from '../types/cue';
import { useState } from 'react';

interface CueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cue: Cue | Omit<NewCue, 'cue_number'>) => void;
  initialData?: Cue;
  mode: 'add' | 'edit';
}

export function CueModal({ isOpen, onClose, onSubmit, initialData, mode }: CueModalProps) {
  const [formData, setFormData] = useState<Partial<Cue>>(
    initialData || {
      start_time: '',
      run_time: '',
      end_time: '',
      activity: '',
      graphics: '',
      video: '',
      audio: '',
      lighting: '',
      notes: '',
      display_id: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">
            {mode === 'add' ? 'Add New Cue' : 'Edit Cue'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'edit' && (
              <div>
                <label htmlFor="display_id" className="block text-sm font-medium mb-1">
                  Cue ID
                </label>
                <input
                  type="text"
                  id="display_id"
                  name="display_id"
                  value={formData.display_id || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {mode === 'add' ? 'Add Cue' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
