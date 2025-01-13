"use client";

import React from 'react';
import { supabase } from "@/lib/supabase";
import { DayCueList } from "@/types/cue";
import { useAuth } from '@/contexts/AuthContext';

interface AddCueListModalProps {
  showId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCueList: DayCueList) => void;
}

export function AddCueListModal({ showId, isOpen, onClose, onSuccess }: AddCueListModalProps) {
  const { user } = useAuth();
  const [newCueListName, setNewCueListName] = React.useState("");
  const [newCueListDate, setNewCueListDate] = React.useState("");
  const [error, setError] = React.useState("");

  const handleAddCueList = async () => {
    if (!showId || !newCueListName || !newCueListDate) return;

    try {
      const { data, error } = await supabase
        .from('day_cue_lists')
        .insert({
          show_id: showId,
          name: newCueListName,
          date: newCueListDate,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onSuccess(data);
        setNewCueListName("");
        setNewCueListDate("");
        setError("");
      }
    } catch (err: any) {
      console.error('Error adding cue list:', err);
      setError(err.message || 'Failed to add cue list');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add New Cue List</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={newCueListName}
              onChange={(e) => setNewCueListName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="e.g., Opening Night"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={newCueListDate}
              onChange={(e) => setNewCueListDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCueList}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newCueListName || !newCueListDate}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
