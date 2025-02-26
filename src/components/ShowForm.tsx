'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ShowFormProps {
  onSuccess?: (showId: string) => void;
}

export function ShowForm({ onSuccess }: ShowFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create the show
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert([
          {
            title,
            description,
          },
        ])
        .select()
        .single();

      if (showError) throw showError;

      // 2. Create the default cue list
      const { error: cueListError } = await supabase
        .from('day_cue_lists')
        .insert([
          {
            show_id: show.id,
            name: 'Default Cue List',
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
          },
        ]);

      if (cueListError) throw cueListError;

      if (onSuccess) {
        onSuccess(show.id);
      }
    } catch (err) {
      console.error('Error creating show:', err);
      setError('Failed to create show. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Show Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Show'}
      </button>
    </form>
  );
}
