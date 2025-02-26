"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { Cue } from "@/types/cue";
import { getAllCues, updateCue, createCue, deleteCue } from "@/services/cueService";
import { Show, createShow, getAllShows, updateShow } from "@/services/showService";
import { DayCueList } from "@/types/dayCueList";
import { cn } from "@/lib/utils";
import { ensureUniqueCueNumber } from '@/utils/cueNumbering';
import { useSettings } from '@/contexts/SettingsContext';
import dynamic from 'next/dynamic';
import { supabase } from "@/lib/supabase";
import { CueSheetHeader } from './CueSheetHeader';
import { SortableCueTable } from './SortableCueTable';
import { CueModal } from './CueModal';

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
        const shows = await getAllShows();
        console.log('Existing shows:', shows);

        let currentShow: Show;
        if (shows.length === 0) {
          console.log('No shows found, creating default show');
          currentShow = await createShow({ 
            title: "Default Show",
            description: "Default show created automatically"
          });
          console.log('Created new show:', currentShow);
        } else {
          currentShow = shows[0];
          console.log('Using existing show:', currentShow);
        }
        
        setShow(currentShow);

        try {
          // Load cue lists
          const { data: lists, error: listsError } = await supabase
            .from('day_cue_lists')
            .select('*')
            .eq('show_id', currentShow.id)
            .order('date');

          if (listsError) throw listsError;
          setCueLists(lists);

          // If there are cue lists, select the first one
          if (lists.length > 0) {
            setSelectedCueList(lists[0]);
            
            // Load cues for the selected cue list
            const { data: cueData, error: cuesError } = await supabase
              .from('cues')
              .select('*')
              .eq('day_cue_list_id', lists[0].id)
              .order('cue_number');

            if (cuesError) throw cuesError;
            setCues(cueData);
          }
        } catch (error) {
          console.error('Error loading cue lists:', error);
        }
      } catch (error) {
        console.error('Error in loadShowAndCues:', error);
      }
    };

    loadShowAndCues();
  }, []);

  // Load cues when selected cue list changes
  useEffect(() => {
    const loadCuesForList = async () => {
      if (!selectedCueList) {
        setCues([]);
        return;
      }

      try {
        const { data: cueData, error: cuesError } = await supabase
          .from('cues')
          .select('*')
          .eq('day_cue_list_id', selectedCueList.id)
          .order('cue_number');

        if (cuesError) throw cuesError;
        setCues(cueData || []);
      } catch (error) {
        console.error('Error loading cues for list:', error);
      }
    };

    loadCuesForList();
  }, [selectedCueList]);

  const handleAddCue = async (index?: number) => {
    setCurrentIndex(index);
    setModalMode('add');
    setSelectedCue({
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
    });
    setIsModalOpen(true);
  };

  const handleEditCue = (cue: Cue) => {
    setModalMode('edit');
    setSelectedCue({
      ...cue,
      display_id: cue.cue_number,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCue = async (id: string) => {
    console.log('Delete button clicked for cue:', id);
    const confirmDelete = window.confirm('Are you sure you want to delete this cue?');
    console.log('User confirmed:', confirmDelete);
    
    if (confirmDelete) {
      try {
        console.log('Attempting to delete cue with ID:', id);
        // Try direct Supabase delete first
        const { error } = await supabase
          .from('cues')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting cue directly:', error);
          throw error;
        }

        console.log('Successfully deleted cue from database');
        // Remove the cue from local state
        setCues(prevCues => prevCues.filter(cue => cue.id !== id));
      } catch (error) {
        console.error('Error in handleDeleteCue:', error);
        alert('Failed to delete cue. Please check console for details.');
      }
    }
  };

  const handleSubmitCue = async (cueData: Cue | Omit<Cue, 'cue_number'>) => {
    try {
      if (!selectedCueList?.id) {
        console.error('No cue list selected');
        return;
      }

      // If the cue has an ID, it's an update
      if ('id' in cueData) {
        const updatedCue = await updateCue(cueData.id, {
          ...cueData,
          cue_number: cueData.cue_number,
          start_time: cueData.start_time || '00:00:00',
          run_time: cueData.run_time || '00:00:00',
          end_time: cueData.end_time || '00:00:00',
        });
        
        // Update the cues list
        setCues(prevCues => 
          prevCues.map(cue => 
            cue.id === updatedCue.id ? updatedCue : cue
          )
        );
      } else {
        // It's a new cue
        const existingCueNumbers = await supabase
          .from('cues')
          .select('cue_number')
          .eq('day_cue_list_id', selectedCueList.id);

        const newCueNumber = ensureUniqueCueNumber(cueData.cue_number || 'A001', existingCueNumbers.data.map(cue => cue.cue_number));

        const newCue = await createCue({
          ...cueData,
          day_cue_list_id: selectedCueList.id,
          cue_number: newCueNumber, 
          start_time: cueData.start_time || '00:00:00',
          run_time: cueData.run_time || '00:00:00',
          end_time: cueData.end_time || '00:00:00',
        });

        setCues(prevCues => [...prevCues, newCue].sort((a, b) => 
          a.cue_number.localeCompare(b.cue_number)
        ));
      }

      setIsModalOpen(false);
      setSelectedCue(undefined);
      setCurrentIndex(undefined);
    } catch (error: any) {
      console.error('Error saving cue:', error);
      if (error.message) {
        console.error('Error details:', error.message);
      }
      // Show error to user
      alert(error instanceof Error ? error.message : 'An error occurred while saving the cue');
    }
  };

  const handleCueListAdded = (newCueList: DayCueList) => {
    setCueLists(prev => [...prev, newCueList]);
    setIsAddingCueList(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
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
            onSuccess={(newCueList) => {
              setCueLists(prev => [...prev, newCueList]);
              setIsAddingCueList(false);
            }}
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
