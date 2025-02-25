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
  const [formData, setFormData] = useState<Partial<Cue>>(() => {
    if (initialData) {
      return { ...initialData };
    }
    
    return {
      cue_number: generateNextCueNumber(cues, currentIndex),
      start_time: '11:26 AM',
      run_time: '00:05',
      end_time: '11:26 AM',
      activity: '',
      graphics: '',
      video: '',
      audio: '',
      lighting: '',
      notes: '',
      day_cue_list_id: showId,
      display_id: generateNextCueNumber(cues, currentIndex),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add New Cue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cue ID
              </label>
              <input
                type="text"
                value={formData.cue_number || ''}
                onChange={(e) => setFormData({ ...formData, cue_number: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
                placeholder="B009"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Run Time
              </label>
              <input
                type="text"
                value={formData.run_time || ''}
                onChange={(e) => setFormData({ ...formData, run_time: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
                placeholder="00:05"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={formData.start_time || ''}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
                placeholder="11:26 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={formData.end_time || ''}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
                placeholder="11:26 AM"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Activity
            </label>
            <input
              type="text"
              value={formData.activity || ''}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Activity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Graphics
            </label>
            <input
              type="text"
              value={formData.graphics || ''}
              onChange={(e) => setFormData({ ...formData, graphics: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Graphics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video
            </label>
            <input
              type="text"
              value={formData.video || ''}
              onChange={(e) => setFormData({ ...formData, video: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Video"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Audio
            </label>
            <input
              type="text"
              value={formData.audio || ''}
              onChange={(e) => setFormData({ ...formData, audio: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Audio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Lighting
            </label>
            <input
              type="text"
              value={formData.lighting || ''}
              onChange={(e) => setFormData({ ...formData, lighting: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Lighting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500"
              placeholder="Enter Notes"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
