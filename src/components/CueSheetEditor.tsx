"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { Cue } from "@/types/cue";
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { ensureUniqueCueNumber } from '@/utils/cueNumbering';
import { useSettings } from '@/contexts/SettingsContext';
import dynamic from 'next/dynamic';
import { CueSheetHeader } from './CueSheetHeader';
import { SortableCueTable } from './SortableCueTable';
import { CueModal } from './CueModal';
import { DayCueList } from "@/types/cue";

// Dynamically import components to reduce initial bundle size
const DynamicCueStats = dynamic(() => import('./CueStats').then(mod => mod.CueStats), {
  ssr: false,
  loading: () => <div className="mt-4 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
});

const DynamicAddCueListModal = dynamic(() => import('./AddCueListModal').then(mod => mod.AddCueListModal), {
  ssr: false,
  loading: () => null
});

const DynamicCueSheetStats = dynamic(() => import('./CueSheetStats').then(mod => mod.CueSheetStats), {
  ssr: false,
  loading: () => <div className="mt-4 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
});

interface Show {
  id: string;
  title: string;
  description?: string;
  creator_id?: string;
  is_template?: boolean;
  metadata?: Record<string, any>;
}

const CueSheetEditor = () => {
  const [mounted, setMounted] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);
  const [show, setShow] = useState<Show | null>(null);
  const [cueLists, setCueLists] = useState<DayCueList[]>([]);
  const [selectedCueList, setSelectedCueList] = useState<DayCueList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCue, setSelectedCue] = useState<Cue | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentIndex, setCurrentIndex] = useState<number | undefined>();
  const [isAddingCueList, setIsAddingCueList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  // Load or create show and its cues when component mounts
  useEffect(() => {
    const loadShowAndCues = async () => {
      try {
        setLoading(true);
        // Query for existing shows
        const showsQuery = query(
          collection(db, 'shows'),
          orderBy('created_at', 'desc'),
          where('is_archived', '==', false)
        );
        
        const showsSnapshot = await getDocs(showsQuery);
        
        let currentShow: Show;
        
        if (showsSnapshot.empty) {
          // No shows found, create a default show
          const newShowRef = await addDoc(collection(db, 'shows'), {
            title: "Default Show",
            description: "Default show created automatically",
            is_archived: false,
            is_template: false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            total_cues: 0
          });
          
          const newShowDoc = await getDoc(newShowRef);
          currentShow = {
            id: newShowRef.id,
            ...newShowDoc.data() as Omit<Show, 'id'>
          };
        } else {
          // Use the first show
          const showDoc = showsSnapshot.docs[0];
          currentShow = {
            id: showDoc.id,
            ...showDoc.data() as Omit<Show, 'id'>
          };
        }
        
        setShow(currentShow);
        
        try {
          // Load cue lists for the show
          const cueListsQuery = query(
            collection(db, 'day_cue_lists'),
            where('show_id', '==', currentShow.id),
            orderBy('date')
          );
          
          const cueListsSnapshot = await getDocs(cueListsQuery);
          const lists = cueListsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as DayCueList[];
          
          setCueLists(lists);
          
          // If there are cue lists, select the first one
          if (lists.length > 0) {
            setSelectedCueList(lists[0]);
          } else {
            // Create a default cue list if none exists
            const today = new Date().toISOString().split('T')[0];
            const newCueListRef = await addDoc(collection(db, 'day_cue_lists'), {
              show_id: currentShow.id,
              name: 'Default Cue List',
              date: today,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            });
            
            const newCueList = {
              id: newCueListRef.id,
              show_id: currentShow.id,
              name: 'Default Cue List',
              date: today
            };
            
            setCueLists([newCueList]);
            setSelectedCueList(newCueList);
          }
        } catch (error) {
          console.error('Error loading cue lists:', error);
          setError('Failed to load cue lists');
        }
      } catch (error) {
        console.error('Error in loadShowAndCues:', error);
        setError('Failed to load show data');
      } finally {
        setLoading(false);
      }
    };

    loadShowAndCues();
  }, []);

  // Load cues when selected cue list changes
  useEffect(() => {
    if (!selectedCueList) {
      setCues([]);
      return;
    }
    
    const loadCuesForList = () => {
      const cuesQuery = query(
        collection(db, 'cues'),
        where('day_cue_list_id', '==', selectedCueList.id),
        orderBy('cue_number')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        cuesQuery,
        (snapshot) => {
          const cueData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Cue[];
          
          setCues(cueData);
        },
        (error) => {
          console.error('Error getting cues:', error);
          setError('Failed to load cues');
        }
      );
      
      return unsubscribe;
    };
    
    const unsubscribe = loadCuesForList();
    
    // Cleanup function to unsubscribe when component unmounts or cue list changes
    return () => unsubscribe();
  }, [selectedCueList]);

  const handleAddCue = async (index?: number) => {
    setCurrentIndex(index);
    setModalMode('add');
    setSelectedCue({
      id: '',
      cue_number: '',
      display_id: '',  
      start_time: '',
      run_time: '',
      end_time: '',
      activity: '',
      graphics: '',
      video: '',
      audio: '',
      lighting: '',
      notes: '',
      day_cue_list_id: selectedCueList?.id
    });
    setIsModalOpen(true);
  };

  const handleEditCue = (cue: Cue) => {
    setModalMode('edit');
    setSelectedCue({
      ...cue,
      display_id: cue.display_id || cue.cue_number,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCue = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this cue?');
    
    if (confirmDelete) {
      try {
        const cueRef = doc(db, 'cues', id);
        await deleteDoc(cueRef);
        
        // The real-time listener will automatically update the cues list
      } catch (error) {
        console.error('Error deleting cue:', error);
        alert('Failed to delete cue. Please try again.');
      }
    }
  };

  const handleSubmitCue = async (cueData: Cue | Omit<Cue, 'id'>) => {
    try {
      if (!selectedCueList?.id) {
        console.error('No cue list selected');
        return;
      }

      // Check for unique cue number
      const cuesCollection = collection(db, 'cues');
      const cueNumberQuery = query(
        cuesCollection,
        where('day_cue_list_id', '==', selectedCueList.id),
        where('cue_number', '==', cueData.cue_number),
      );
      
      const cueNumberSnapshot = await getDocs(cueNumberQuery);
      
      const isExistingCueNumber = !cueNumberSnapshot.empty && 
        (modalMode === 'add' || 
         (modalMode === 'edit' && cueNumberSnapshot.docs[0].id !== (cueData as Cue).id));
      
      if (isExistingCueNumber) {
        // Generate a unique cue number
        const allCueNumbers = cues.map(c => c.cue_number);
        cueData.cue_number = ensureUniqueCueNumber(cueData.cue_number, allCueNumbers);
      }

      // If the cue has an ID, it's an update
      if ('id' in cueData && cueData.id) {
        const cueRef = doc(db, 'cues', cueData.id);
        await updateDoc(cueRef, {
          ...cueData,
          updated_at: serverTimestamp()
        });
      } else {
        // It's a new cue
        await addDoc(collection(db, 'cues'), {
          ...cueData,
          day_cue_list_id: selectedCueList.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      setSelectedCue(undefined);
      setCurrentIndex(undefined);
    } catch (error: any) {
      console.error('Error saving cue:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'An error occurred while saving the cue');
    }
  };

  const handleCueListAdded = (newCueList: DayCueList) => {
    setCueLists(prev => [...prev, newCueList]);
    setSelectedCueList(newCueList);
    setIsAddingCueList(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-4 max-w-md bg-red-50 rounded-md border border-red-200">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-white dark:bg-gray-900",
      getFontSizeClass()
    )}>
      <CueSheetHeader
        show={show}
        selectedCueList={selectedCueList}
        cueLists={cueLists}
        onCueListSelect={setSelectedCueList}
        onAddCueList={() => setIsAddingCueList(true)}
        onAddCue={() => {
          if (!selectedCueList) return;
          setModalMode('add');
          setSelectedCue(undefined);
          setIsModalOpen(true);
        }}
        onShowUpdate={setShow}
      />
      <main className="flex overflow-hidden flex-1">
        <div className="flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-300">Cue List</h2>
          </div>
          <SortableCueTable
            cues={cues}
            selectedCueListId={selectedCueList?.id || null}
            showBorders={settings.showBorders}
            onEditCue={handleEditCue}
            onDeleteCue={handleDeleteCue}
            onAddCue={handleAddCue}
            onCuesChange={setCues}
          />
          {/* Totals Footer */}
          {settings.showStats && (
            <DynamicCueSheetStats cues={cues} />
          )}
        </div>
      </main>
      
      {/* Modals */}
      {mounted && (
        <>
          <DynamicAddCueListModal
            showId={show?.id || ''}
            isOpen={isAddingCueList}
            onClose={() => setIsAddingCueList(false)}
            onSuccess={handleCueListAdded}
          />

          {show && (
            <CueModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleSubmitCue}
              initialData={selectedCue}
              mode={modalMode}
              cues={cues}
              currentIndex={currentIndex}
              showId={show.id}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CueSheetEditor;