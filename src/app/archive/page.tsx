'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
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
  is_archived: boolean;
}

export default function ArchivePage() {
  const [shows, setShows] = React.useState<Show[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fetchShows = async () => {
    try {
      const { data: showsData, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .eq('is_archived', true)
        .order('created_at', { ascending: false });

      if (showsError) {
        throw showsError;
      }

      setShows(showsData || []);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchShows();
  }, []);

  const handleViewCueList = (showId: string) => {
    router.push(`/show/${showId}`);
  };

  const handleUnarchiveShow = async (showId: string) => {
    try {
      const { error } = await supabase
        .from('shows')
        .update({ is_archived: false })
        .eq('id', showId);

      if (error) {
        throw error;
      }

      // Refresh the shows list
      fetchShows();
    } catch (error) {
      console.error('Error unarchiving show:', error);
      alert('Failed to unarchive show. Please try again.');
    }
  };

  const filteredShows = shows.filter(show =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Archived Shows</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search archived shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <div
              key={show.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {show.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {show.description || 'No description'}
                </p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleViewCueList(show.id)}
                    className="px-4 py-2 w-full text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View Cue List
                  </button>
                  <button
                    onClick={() => handleUnarchiveShow(show.id)}
                    className="flex items-center justify-center px-4 py-2 w-full text-gray-700 bg-gray-100 rounded-md transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Unarchive Show
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredShows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No archived shows found</p>
          </div>
        )}
      </div>
    </div>
  );
}
