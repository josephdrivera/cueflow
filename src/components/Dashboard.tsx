'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Plus, Archive } from 'lucide-react';

interface Show {
  id: string;
  title: string;
  created_at: string;
  description?: string;
  user_id?: string;
  is_template?: boolean;
  metadata?: any;
  total_cues: number;
  is_archived: boolean;
  archived?: boolean;
}

interface CreateShowFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  is_template: boolean;
}

export function Dashboard() {
  const [shows, setShows] = React.useState<Show[]>([]);
  const [invitedShows, setInvitedShows] = React.useState<Show[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateShowFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    is_template: false,
  });
  const [archivingShowId, setArchivingShowId] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchShows = async () => {
    try {
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw userError;
      }

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch personal shows
      const { data: personalShows, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      console.log('Personal shows query:', {
        userId: user.id,
        shows: personalShows,
        error: showsError,
        showCount: personalShows?.length || 0
      });

      if (showsError) {
        console.error('Failed to fetch personal shows:', showsError);
        setShows([]);
      } else {
        setShows(personalShows || []);
      }

      // Fetch shows where user is invited
      const { data: collaborations, error: collabError } = await supabase
        .from('show_collaborators')
        .select('show_id')
        .eq('user_id', user.id);

      if (collabError) {
        console.error('Failed to fetch collaborations:', collabError);
        setInvitedShows([]);
      } else {
        const showIds = collaborations?.map(collab => collab.show_id) || [];

        if (showIds.length > 0) {
          const { data: invitedShowsData, error: invitedError } = await supabase
            .from('shows')
            .select('*')
            .in('id', showIds)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

          if (invitedError) {
            console.error('Failed to fetch invited shows:', invitedError);
            setInvitedShows([]);
          } else {
            setInvitedShows(invitedShowsData || []);
          }
        } else {
          setInvitedShows([]);
        }
      }
    } catch (error) {
      console.error('Error in fetchShows:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while fetching shows');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter shows based on search query
  const filteredPersonalShows = shows.filter(show =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitedShows = invitedShows.filter(show =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCueList = (showId: string) => {
    router.push(`/show/${showId}`);
  };

  const handleArchiveShow = async (showId: string) => {
    try {
      setArchivingShowId(showId);
      
      // Update the show's archived status
      const { error: archiveError } = await supabase
        .from('shows')
        .update({ is_archived: true })
        .eq('id', showId);

      if (archiveError) {
        throw archiveError;
      }

      // Refresh the shows list
      fetchShows();
      router.push('/archive');
    } catch (error) {
      console.error('Error archiving show:', error);
      alert('Failed to archive show. Please try again.');
    } finally {
      setArchivingShowId(null);
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data: show, error: createError } = await supabase
        .from('shows')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            user_id: user.id,
            is_template: formData.is_template,
            metadata: {
              date: formData.date,
              time: formData.time,
            },
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      if (show) {
        setShows((prevShows) => [{ ...show, total_cues: 0 }, ...prevShows]);
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
          is_template: false,
        });
      }
    } catch (err) {
      console.error('Error creating show:', err);
      setError(err instanceof Error ? err.message : 'Failed to create show');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  React.useEffect(() => {
    const setupSubscription = async () => {
      const { data: { subscription } } = await supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          fetchShows();
        } else if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    };

    setupSubscription();
    fetchShows();
  }, []);

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Show
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search shows..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Personal Shows */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonalShows.map((show) => (
              <div
                key={show.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {show.title}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {new Date(show.created_at).toLocaleDateString()} • {show.total_cues} cues
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewCueList(show.id)}
                      className="w-full px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View Cue List
                    </button>
                    <button
                      onClick={() => handleArchiveShow(show.id)}
                      disabled={archivingShowId === show.id}
                      className="flex items-center justify-center w-full px-4 py-2 text-white bg-red-600 rounded-md transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {archivingShowId === show.id ? 'Archiving...' : 'Archive Show'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPersonalShows.length === 0 && (
            <div className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No personal shows found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Create your first show to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Invited Shows */}
        {invitedShows.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Invited Shows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvitedShows.map((show) => (
                <div
                  key={show.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-green-500"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {show.title}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {new Date(show.created_at).toLocaleDateString()} • {show.total_cues} cues
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewCueList(show.id)}
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        View Cue List
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Show Modal */}
        {isCreateModalOpen && (
          <div className="overflow-y-auto fixed inset-0 z-50">
            <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block overflow-hidden text-left align-bottom bg-white dark:bg-gray-900 rounded-lg shadow-xl transition-all transform sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleCreateShow}>
                  <div className="px-6 pt-6 pb-4">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                      Create New Show
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          required
                          placeholder="Enter show title"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          placeholder="Enter show description"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            required
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            id="time"
                            required
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            value={formData.time}
                            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_template"
                          className="h-4 w-4 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          checked={formData.is_template}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                        />
                        <label htmlFor="is_template" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Save as template
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isCreating ? 'Creating...' : 'Create Show'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}