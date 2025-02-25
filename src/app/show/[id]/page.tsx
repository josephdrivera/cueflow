'use client';

import React, { useState } from 'react';
import { CueList } from '@/components/CueList';
import { CueListManager } from '@/components/CueListManager'; 
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Settings, Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShowPageProps {
  params: {
    id: string;
  };
}

export default function ShowPage({ params }: ShowPageProps) {
  const unwrappedParams = React.use(params);
  const [showTitle, setShowTitle] = React.useState<string>('');
  const [selectedCueListId, setSelectedCueListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const fetchShowTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select('title')
          .eq('id', unwrappedParams.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setShowTitle(data.title);
        }
      } catch (error) {
        console.error('Error fetching show title:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowTitle();
  }, [unwrappedParams.id]);

  const handleArchiveShow = async () => {
    try {
      setIsArchiving(true);
      
      // Update the show's archived status
      const { error: archiveError } = await supabase
        .from('shows')
        .update({ is_archived: true })
        .eq('id', unwrappedParams.id);

      if (archiveError) {
        throw archiveError;
      }

      // Redirect to archive page
      router.push('/archive');
    } catch (error) {
      console.error('Error archiving show:', error);
      alert('Failed to archive show. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6 mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">{showTitle}</h1>
          </div>
          <Link
            href={`/settings`}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Settings className="mr-2 w-5 h-5" />
            Settings
          </Link>
        </div>
        
        {/* Cue List Manager */}
        <div className="mb-6">
          <CueListManager 
            showId={unwrappedParams.id} 
            onSelectCueList={(cueListId) => setSelectedCueListId(cueListId)} 
          />
        </div>
        
        {/* Cue List */}
        {selectedCueListId ? (
          <CueList 
            showId={unwrappedParams.id} 
            cueListId={selectedCueListId} 
          />
        ) : (
          <div className="p-8 text-center bg-gray-100 rounded-lg dark:bg-gray-800">
            Select or create a cue list to get started
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={handleArchiveShow}
            disabled={isArchiving}
            className="flex justify-center items-center px-4 py-2 w-full text-white bg-red-600 rounded-md transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="mr-2 w-5 h-5" />
            {isArchiving ? 'Archiving Show...' : 'Archive Show'}
          </button>
        </div>
      </div>
    </div>
  );
}