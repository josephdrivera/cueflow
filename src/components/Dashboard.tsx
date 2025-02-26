'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Plus, Archive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PendingInvitations from './PendingInvitations';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

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
}

interface CreateShowFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  is_template: boolean;
}

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [invitedShows, setInvitedShows] = useState<Show[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateShowFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    is_template: false,
  });
  const [archivingShowId, setArchivingShowId] = useState<string | null>(null);
  const router = useRouter();

  // Set up listeners for shows when the user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;
    
    setIsLoading(true);
    setError(null);
    
    // Query for user's shows
    const showsQuery = query(
      collection(db, 'shows'),
      where('user_id', '==', user.uid),
      where('is_archived', '==', false),
      orderBy('created_at', 'desc')
    );
    
    // Subscribe to shows collection
    const unsubscribeShows = onSnapshot(
      showsQuery,
      (snapshot) => {
        const showsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Show[];
        
        setShows(showsList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching shows:', err);
        setError('Failed to load shows. Please try again.');
        setIsLoading(false);
      }
    );
    
    // Query for collaborations
    const collabsQuery = query(
      collection(db, 'show_collaborators'),
      where('user_id', '==', user.uid)
    );
    
    const unsubscribeCollabs = onSnapshot(
      collabsQuery,
      async (snapshot) => {
        const showIds = snapshot.docs.map(doc => doc.data().show_id);
        
        if (showIds.length > 0) {
          // Fetch the shows that user is a collaborator on
          // This approach is necessary for Firebase (not ideal, but working)
          const allShowsQuery = query(
            collection(db, 'shows'),
            where('is_archived', '==', false)
          );
          
          const showsSnapshot = await getDocs(allShowsQuery);
          const invitedShowsList = showsSnapshot.docs
            .filter(doc => showIds.includes(doc.id))
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
            })) as Show[];
          
          setInvitedShows(invitedShowsList);
        } else {
          setInvitedShows([]);
        }
      },
      (err) => {
        console.error('Error fetching collaborations:', err);
        // Don't set loading or error state here as it's secondary data
      }
    );
    
    // Cleanup
    return () => {
      unsubscribeShows();
      unsubscribeCollabs();
    };
  }, [user, authLoading]);

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
      const showRef = doc(db, 'shows', showId);
      await updateDoc(showRef, { 
        is_archived: true,
        updated_at: serverTimestamp()
      });
      
      // The shows list will automatically update via the snapshot listener
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
    if (!formData.title.trim() || !user) return;

    try {
      setIsCreating(true);
      setError(null);

      // Create a new show document in Firestore
      const showRef = await addDoc(collection(db, 'shows'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        user_id: user.uid,
        is_template: formData.is_template,
        is_archived: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        total_cues: 0
      });

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        is_template: false,
      });
      setIsCreateModalOpen(false);
      
      // Navigate to the new show
      router.push(`/show/${showRef.id}`);
    } catch (err) {
      console.error('Error creating show:', err);
      setError('Failed to create show. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
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
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 w-5 h-5" />
              Create Show
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Link
              href="/settings"
              className="p-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Shows</h2>
          <Link
            href="/settings"
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* PendingInvitations component will handle fetching its own data */}
        <div className="mb-6">
          <PendingInvitations />
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search shows..."
            className="py-2 pr-4 pl-10 w-full text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Your Shows</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPersonalShows.length > 0 ? (
              filteredPersonalShows.map((show) => (
                <div
                  key={show.id}
                  className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800"
                >
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {show.title}
                    </h3>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(show.created_at).toLocaleDateString()} • {show.total_cues} cues
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewCueList(show.id)}
                        className="px-4 py-2 w-full text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        View Cue List
                      </button>
                      <button
                        onClick={() => handleArchiveShow(show.id)}
                        disabled={archivingShowId === show.id}
                        className="flex justify-center items-center px-4 py-2 w-full text-white bg-red-600 rounded-md transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Archive className="mr-2 w-4 h-4" />
                        {archivingShowId === show.id ? 'Archiving...' : 'Archive Show'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 py-12 text-center md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No personal shows found
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Try a different search term' : 'Create your first show to get started'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Invited Shows */}
        {filteredInvitedShows.length > 0 && (
          <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Invited Shows</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredInvitedShows.map((show) => (
                <div
                  key={show.id}
                  className="overflow-hidden bg-white rounded-lg border-l-4 border-green-500 shadow-md dark:bg-gray-800"
                >
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {show.title}
                    </h3>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(show.created_at).toLocaleDateString()} • {show.total_cues} cues
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewCueList(show.id)}
                        className="px-4 py-2 w-full text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

              <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleCreateShow}>
                  <div className="px-6 pt-6 pb-4">
                    <h3 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                      Create New Show
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          required
                          placeholder="Enter show title"
                          className="block w-full placeholder-gray-400 text-gray-900 bg-gray-50 rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:placeholder-gray-500"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          placeholder="Enter show description"
                          className="block w-full placeholder-gray-400 text-gray-900 bg-gray-50 rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:placeholder-gray-500"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            required
                            className="block w-full text-gray-900 bg-gray-50 rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label htmlFor="time" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Time
                          </label>
                          <input
                            type="time"
                            id="time"
                            required
                            className="block w-full text-gray-900 bg-gray-50 rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            value={formData.time}
                            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_template"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:text-blue-400 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          checked={formData.is_template}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                        />
                        <label htmlFor="is_template" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Save as template
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end px-6 py-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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