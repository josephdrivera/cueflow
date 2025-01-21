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

        const { data: showsData, error: showsError } = await supabase
          .from('shows')
          .select('*')
          .order('created_at', { ascending: false });

        if (showsError) {
          console.error('Failed to fetch shows:', showsError);
          throw new Error(showsError.message);
        }

        if (!showsData) {
          console.log('No shows found');
          setShows([]);
          return;
        }

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
                id: show.id,
                title: show.title || 'Untitled Show',
                created_at: show.created_at,
                description: show.description,
                creator_id: show.creator_id,
                is_template: show.is_template,
                metadata: show.metadata,
                total_cues: count || 0
              };
            } catch (err) {
              console.error(`Error processing show ${show.id}:`, err);
              return {
                id: show.id,
                title: show.title || 'Untitled Show',
                created_at: show.created_at,
                description: show.description,
                creator_id: show.creator_id,
                is_template: show.is_template,
                metadata: show.metadata,
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
        } else if (typeof err === 'object' && err !== null) {
          setError(JSON.stringify(err, null, 2));
        } else {
          setError('An unexpected error occurred while fetching shows');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading shows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-lg mx-auto">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Shows
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">CueFlow Dashboard</h1>
      
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search shows..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-3 flex items-center">
          <svg
            className="h-5 w-5 text-gray-400"
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
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {show.title}
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{new Date(show.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{show.total_cues} cues</span>
              </div>
              <button
                onClick={() => handleViewCueList(show.id)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                View Cue List
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredShows.length === 0 && (
        <div className="text-center py-12">
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
