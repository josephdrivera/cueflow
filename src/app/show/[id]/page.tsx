'use client';

import React from 'react';
import { CueList } from '@/components/CueList';
import { supabase } from '@/lib/supabase';

interface ShowPageProps {
  params: {
    id: string;
  };
}

export default function ShowPage({ params }: ShowPageProps) {
  const [showTitle, setShowTitle] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchShowTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select('title')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (data) {
          setShowTitle(data.title);
        }
      } catch (error) {
        console.error('Error fetching show:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowTitle();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading show...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{showTitle}</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      <CueList showId={params.id} />
    </div>
  );
}
