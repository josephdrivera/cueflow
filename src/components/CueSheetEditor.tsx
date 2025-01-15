"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { Clock, Edit2, Plus, Settings, Settings2, Trash2, GripVertical, Check, X } from 'lucide-react'
import { ThemeToggle } from "./ThemeToggle"
import { CueModal } from './CueModal';
import { Cue } from "@/types/cue";
import { getAllCues, updateCue, createCue, deleteCue } from "@/services/cueService";
import { Show, createShow, getAllShows, updateShow } from "@/services/showService";
import { DayCueList } from "@/types/dayCueList";
import { cn } from "@/lib/utils";
import { validateCueNumber, generateCueNumberBetween, ensureUniqueCueNumber } from '@/utils/cueNumbering';
import { useSettings } from '@/contexts/SettingsContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from "@/lib/supabase";

const DynamicCueStats = dynamic(() => import('./CueStats').then(mod => mod.CueStats), {
  ssr: false,
  loading: () => <div className="mt-4 h-8 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
});

const DynamicAddCueListModal = dynamic(() => import('./AddCueListModal').then(mod => mod.AddCueListModal), {
  ssr: false,
  loading: () => null
});

const CueControls = ({ 
  selectedCueList, 
  cueLists, 
  onCueListSelect, 
  onAddCueList, 
  onAddCue 
}: { 
  selectedCueList: DayCueList | null;
  cueLists: DayCueList[];
  onCueListSelect: (cueList: DayCueList | null) => void;
  onAddCueList: () => void;
  onAddCue: () => void;
}) => {
  return (
    <div className="flex gap-4 items-center">
      <select
        value={selectedCueList?.id || ""}
        onChange={(e) => {
          const selected = cueLists.find(list => list.id === e.target.value);
          onCueListSelect(selected || null);
        }}
        className="px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
      >
        <option value="">Select a cue list</option>
        {cueLists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name} ({list.date})
          </option>
        ))}
      </select>
      <button
        onClick={onAddCueList}
        className="flex gap-2 items-center px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
      >
        <Plus size={16} />
        Add Cue List
      </button>
      <button
        onClick={onAddCue}
        className="flex gap-2 items-center px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!selectedCueList}
      >
        <Plus size={16} />
        Add Cue
      </button>
      <ThemeToggle />
      <Link href="/settings" className="text-gray-500 hover:text-gray-600">
        <Settings size={20} />
      </Link>
    </div>
  );
};

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isAddingCueList, setIsAddingCueList] = useState(false);
  const { settings } = useSettings();
  const tableRef = React.useRef<HTMLTableElement>(null);

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
              .eq('cue_list_id', lists[0].id)
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

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.className = cn("min-w-full", settings.showBorders && "border-collapse [&_td]:border-r [&_th]:border-r dark:[&_td]:border-gray-800 dark:[&_th]:border-gray-800 [&_td]:border-gray-200 [&_th]:border-gray-200 [&_tr_td:last-child]:border-0 [&_tr_th:last-child]:border-0")
    }
  }, [settings.showBorders]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    try {
      if (!selectedCueList?.id) {
        console.error('No cue list ID available');
        return;
      }

      const oldIndex = cues.findIndex((cue) => cue.id === active.id);
      const newIndex = cues.findIndex((cue) => cue.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find cues to swap:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
        return;
      }

      console.log('Moving cue from index', oldIndex, 'to', newIndex);
      const newCues = arrayMove(cues, oldIndex, newIndex);
      
      // Get the surrounding cue numbers for the new position
      const prevCue = newIndex > 0 ? newCues[newIndex - 1] : null;
      const nextCue = newIndex < newCues.length - 1 ? newCues[newIndex + 1] : null;
      
      let newCueNumber;
      if (!prevCue) {
        // If it's the first cue
        newCueNumber = nextCue ? generateCueNumberBetween(null, nextCue.cue_number) : 'A101';
      } else if (!nextCue) {
        // If it's the last cue
        newCueNumber = generateCueNumberBetween(prevCue.cue_number, null);
      } else {
        // If it's between two cues
        newCueNumber = generateCueNumberBetween(prevCue.cue_number, nextCue.cue_number);
      }

      // Ensure the generated cue number is unique
      const existingCueNumbers = cues.map(cue => cue.cue_number);
      newCueNumber = ensureUniqueCueNumber(newCueNumber, existingCueNumbers);

      if (!validateCueNumber(newCueNumber)) {
        throw new Error(`Generated invalid cue number: ${newCueNumber}`);
      }

      console.log('Generated new cue number:', newCueNumber);

      // First, set a temporary cue number to avoid unique constraint
      const tempCueNumber = `TEMP-${Date.now()}-${active.id}`;
      await supabase
        .from('cues')
        .update({ cue_number: tempCueNumber })
        .eq('id', active.id);

      // Then update to the final cue number
      const { data: updatedCue, error: updateError } = await supabase
        .from('cues')
        .update({ cue_number: newCueNumber })
        .eq('id', active.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cue:', updateError);
        // Attempt to restore the original cue number
        const originalCue = cues[oldIndex];
        if (originalCue) {
          await supabase
            .from('cues')
            .update({ cue_number: originalCue.cue_number })
            .eq('id', active.id);
        }
        throw updateError;
      }
      
      if (!updatedCue) {
        console.error('No cue data returned from update');
        throw new Error('Failed to update cue');
      }

      // Refresh the cues list to get the proper order
      const { data: refreshedCues, error: refreshError } = await supabase
        .from('cues')
        .select('*')
        .eq('cue_list_id', selectedCueList.id)
        .order('cue_number');

      if (refreshError) {
        console.error('Error refreshing cues:', refreshError);
        throw refreshError;
      }

      if (!refreshedCues) {
        console.error('No cues returned from refresh');
        throw new Error('Failed to refresh cues');
      }

      console.log('Successfully updated cue order');
      setCues(refreshedCues);
    } catch (error) {
      console.error('Error updating cue order:', error);
      // Refresh the cues list to ensure consistent state
      try {
        const { data: refreshedCues } = await supabase
          .from('cues')
          .select('*')
          .eq('cue_list_id', selectedCueList?.id)
          .order('cue_number');
        if (refreshedCues) {
          setCues(refreshedCues);
        }
      } catch (refreshError) {
        console.error('Error refreshing cues after error:', refreshError);
      }
    }
  };

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
    if (window.confirm('Are you sure you want to delete this cue?')) {
      try {
        await deleteCue(id);
        // Remove the cue from local state
        setCues(prevCues => prevCues.filter(cue => cue.id !== id));
      } catch (error) {
        console.error('Error deleting cue:', error);
        // You might want to show an error message to the user here
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
        const newCue = await createCue({
          ...cueData,
          cue_list_id: selectedCueList.id,
          cue_number: cueData.cue_number || 'A001', 
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

  // Add this function to handle show title updates
  const handleUpdateShowTitle = async () => {
    if (!show || !editedTitle.trim()) return;
    
    try {
      const updatedShow = await updateShow(show.id, { title: editedTitle.trim() });
      setShow(updatedShow);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating show title:', error);
    }
  };

  // Add this function to handle editing mode
  const startEditingTitle = () => {
    if (!show) return;
    setEditedTitle(show.title);
    setIsEditingTitle(true);
  };

  // Calculate totals
  const calculateTotals = React.useCallback(() => {
    const totalCues = cues.length;
    const totalRunTime = cues.reduce((total, cue) => {
      // Convert run_time (expected format: "MM:SS") to seconds
      const [minutes, seconds] = (cue.run_time || "0:00").split(":").map(Number);
      return total + (minutes * 60 + seconds);
    }, 0);

    // Convert total seconds back to MM:SS format
    const totalMinutes = Math.floor(totalRunTime / 60);
    const totalSeconds = totalRunTime % 60;
    const formattedTotalTime = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;

    return {
      totalCues,
      formattedTotalTime
    };
  }, [cues]);

  const totals = React.useMemo(() => calculateTotals(), [calculateTotals]);

  // Add a formatDate utility function
  const formatDate = (dateStr: string) => {
    try {
      // Use UTC to ensure consistent formatting between server and client
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  // Sortable cue row component
  function SortableCueRow({ cue, index, onEdit, onDelete }: { 
    cue: Cue; 
    index: number;
    onEdit: (cue: Cue) => void;
    onDelete: (id: string) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: cue.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <tr ref={setNodeRef} style={style} className="group hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="p-2">
          <button 
            className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.cue_number}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.start_time}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.run_time}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.end_time}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.activity}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.graphics}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.video}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.audio}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.lighting}</td>
        <td className="p-2 text-gray-900 dark:text-gray-300">{cue.notes}</td>
        <td className="p-2">
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(cue)}
              className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(cue.id)}
              className="p-1 text-red-500 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

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
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="px-2 py-1 text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateShowTitle}
                  className="p-1 text-green-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{show?.title || "Loading..."}</h1>
              <button
                onClick={startEditingTitle}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <CueControls
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
          />
        </div>
      </header>
      <main className="flex overflow-hidden flex-1">
        <div className="flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-300">Cue List</h2>
          </div>
          <div className="overflow-auto bg-white rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table ref={tableRef} className={cn("min-w-full", settings.showBorders && "border-collapse [&_td]:border-r [&_th]:border-r dark:[&_td]:border-gray-800 dark:[&_th]:border-gray-800 [&_td]:border-gray-200 [&_th]:border-gray-200 [&_tr_td:last-child]:border-0 [&_tr_th:last-child]:border-0")}>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="w-[50px] text-left p-2 text-gray-600 dark:text-gray-400"></th>
                    <th className="w-[80px] text-left p-2 text-gray-600 dark:text-gray-400">Cue ID</th>
                    <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">Start Time</th>
                    <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">Run Time</th>
                    <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">End Time</th>
                    <th className="p-2 text-left text-gray-600 dark:text-gray-400">Activity</th>
                    <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Graphics</th>
                    <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Video</th>
                    <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Audio</th>
                    <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Lighting</th>
                    <th className="p-2 text-left text-gray-600 dark:text-gray-400">Notes</th>
                    <th className="w-[50px] text-left p-2 text-gray-600 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {/* Insert button before first cue */}
                  <tr>
                    <td colSpan={12} className="p-1">
                      <button
                        onClick={() => handleAddCue(0)}
                        className="w-full py-0.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        <Plus className="mx-auto w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  <SortableContext items={cues.map(cue => cue.id)} strategy={verticalListSortingStrategy}>
                    {cues.map((cue, index) => (
                      <SortableCueRow
                        key={cue.id}
                        cue={cue}
                        index={index}
                        onEdit={handleEditCue}
                        onDelete={handleDeleteCue}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
          {/* Totals Footer */}
          {settings.showStats && (
            <DynamicCueStats
              totalCues={totals.totalCues}
              formattedTotalTime={totals.formattedTotalTime}
            />
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
