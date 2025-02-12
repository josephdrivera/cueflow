'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Show {
  id: string;
  title: string;
  created_at: string;
  description?: string;
  creator_id?: string;
  is_template?: boolean;
  metadata?: any;
  total_cues: number;
}

export function Dashboard() {
  const [shows, setShows] = React.useState<Show[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const fetchShows = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Test connection first
        const { error: testError } = await supabase
          .from('shows')
          .select('count')
          .limit(1)
          .single();

        if (testError) {
          console.error('Connection test failed:', testError);
          throw new Error('Database connection failed. Please check your connection and try again.');
        }

        // Fetch shows data
        const { data: showsData, error: showsError } = await supabase
          .from('shows')
          .select('*')
          .order('created_at', { ascending: false });

        if (showsError) {
          console.error('Failed to fetch shows:', showsError);
          throw new Error(showsError.message || 'Failed to fetch shows data');
        }

        if (!showsData) {
          console.log('No shows found');
          setShows([]);
          return;
        }

        // Process each show to get cue counts
        const showsWithCounts = await Promise.all(
          showsData.map(async (show) => {
            try {
              const { count, error: countError } = await supabase
                .from('showflows')
                .select('*', { count: 'exact', head: true })
                .eq('show_id', show.id);

              if (countError) {
                console.error(`Count error for show ${show.id}:`, countError);
              }

              return {
                ...show,
                total_cues: count || 0
              };
            } catch (err) {
              console.error(`Error processing show ${show.id}:`, err);
              return {
                ...show,
                total_cues: 0
              };
            }
          })
        );

        setShows(showsWithCounts);
      } catch (err) {
        console.error('Error in fetchShows:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred while loading shows');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, []);

  const filteredShows = shows.filter(show =>
    show.title.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleViewCueList = (showId: string) => {
    router.push(`/show/${showId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading shows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 text-xl text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Error Loading Shows
          </h3>
          <p className="text-sm text-gray-500 whitespace-pre-wrap dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">CueFlow Dashboard</h1>
      
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search shows..."
          className="py-2 pr-3 pl-10 w-full leading-5 placeholder-gray-500 text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex absolute inset-y-0 left-3 items-center">
          <svg
            className="w-5 h-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="overflow-hidden bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="p-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                {show.title}
              </h2>
              <div className="flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{new Date(show.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{show.total_cues} cues</span>
              </div>
              <button
                onClick={() => handleViewCueList(show.id)}
                className="px-4 py-2 w-full text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                View Cue List
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredShows.length === 0 && (
        <div className="py-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No shows found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try a different search term' : 'Create your first show to get started'}
          </p>
        </div>
      )}
    </div>
  );
}