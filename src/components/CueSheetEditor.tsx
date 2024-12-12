"use client"

import * as React from "react"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Clock, Edit2, Plus, Settings, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { ThemeToggle } from "./ThemeToggle"
import { CueModal } from './CueModal';
import { Cue, NewCue } from "@/types/cue";
import { insertCueBetween, getAllCues, updateCue, createCue, deleteCue } from "@/services/cueService";
import { Show, createShow, getAllShows } from "@/services/showService";
import { cn } from "@/lib/utils";
import { generateCueNumberBetween, validateCueNumber } from '@/utils/cueNumbering';

export default function CueSheetEditor() {
  const [cues, setCues] = React.useState<Cue[]>([]);
  const [show, setShow] = React.useState<Show | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCue, setSelectedCue] = React.useState<Cue | undefined>();
  const [modalMode, setModalMode] = React.useState<'add' | 'edit'>('add');
  const [insertPosition, setInsertPosition] = React.useState<{
    previousId: string | null;
    nextId: string | null;
  } | null>(null);
  const [insertMenuOpen, setInsertMenuOpen] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState<number | undefined>();

  // Load or create show and its cues when component mounts
  React.useEffect(() => {
    const loadShowAndCues = async () => {
      try {
        // Try to get all shows first
        const shows = await getAllShows();
        console.log('Existing shows:', shows);

        let currentShow: Show;
        if (shows.length === 0) {
          // Create a default show if none exist
          console.log('No shows found, creating default show');
          currentShow = await createShow({ 
            title: "Default Show",
            description: "Default show created automatically"
          });
          console.log('Created new show:', currentShow);
        } else {
          // Use the first show
          currentShow = shows[0];
          console.log('Using existing show:', currentShow);
        }
        
        setShow(currentShow);

        // Now load the cues for this show
        try {
          const loadedCues = await getAllCues(currentShow.id);
          console.log('Loaded cues:', loadedCues);
          setCues(loadedCues);
        } catch (error: any) {
          console.error('Error loading cues:', error);
          // Don't throw here, we can still use the app without cues
          setCues([]);
        }
      } catch (error: any) {
        console.error('Error in loadShowAndCues:', error);
        if (error.message) {
          console.error('Error details:', error.message);
        }
        if (error.details) {
          console.error('Additional details:', error.details);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadShowAndCues();
  }, []);

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
    setInsertPosition(null);
    setIsModalOpen(true);
  };

  const handleInsertCue = (previousId: string | null, nextId: string | null) => {
    setModalMode('add');
    setSelectedCue(undefined);
    setInsertPosition({ previousId, nextId });
    setIsModalOpen(true);
    setInsertMenuOpen(null);
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

  const handleSubmitCue = async (cue: Partial<Cue>) => {
    try {
      if (!show) {
        throw new Error('No show loaded');
      }

      if (modalMode === 'add') {
        const cueData: NewCue = {
          show_id: show.id,
          cue_number: cue.display_id || generateCueNumberBetween(
            insertPosition?.previousId ? cues.find(c => c.id === insertPosition.previousId)?.cue_number : null,
            insertPosition?.nextId ? cues.find(c => c.id === insertPosition.nextId)?.cue_number : null
          ),
          start_time: cue.start_time || '',
          run_time: cue.run_time || '',
          end_time: cue.end_time || '',
          activity: cue.activity || '',
          graphics: cue.graphics || '',
          video: cue.video || '',
          audio: cue.audio || '',
          lighting: cue.lighting || '',
          notes: cue.notes || '',
          previous_cue_id: insertPosition?.previousId || null,
          next_cue_id: insertPosition?.nextId || null,
        };
        
        if (insertPosition) {
          // Insert between cues
          const newCue = await insertCueBetween(
            cueData.show_id,
            insertPosition.previousId,
            insertPosition.nextId,
            cueData
          );
          setCues(prevCues => {
            const newCues = [...prevCues];
            const insertIndex = insertPosition.previousId
              ? newCues.findIndex(c => c.id === insertPosition.previousId) + 1
              : 0;
            newCues.splice(insertIndex, 0, newCue);
            return newCues;
          });
        } else {
          // Add at the end
          const newCue = await createCue(cueData);
          setCues(prevCues => [...prevCues, newCue]);
        }
      } else if (cue.id) {
        // Edit existing cue
        const updatedCue = await updateCue(cue.id, {
          cue_number: cue.display_id, // Map display_id to cue_number
          start_time: cue.start_time || '',
          run_time: cue.run_time || '',
          end_time: cue.end_time || '',
          activity: cue.activity || '',
          graphics: cue.graphics || '',
          video: cue.video || '',
          audio: cue.audio || '',
          lighting: cue.lighting || '',
          notes: cue.notes || '',
          show_id: show.id,
        });
        setCues(prevCues => prevCues.map((c) => (c.id === updatedCue.id ? updatedCue : c)));
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving cue:', error);
      if (error.message) {
        console.error('Error details:', error.message);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">CueFlow: {show?.title}</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button className="inline-flex items-center px-4 py-2 rounded-md border">
            <Clock className="mr-2 w-4 h-4" />
            Live Mode
          </button>
          <button className="inline-flex items-center px-4 py-2 rounded-md border">
            <Settings className="mr-2 w-4 h-4" />
            Settings
          </button>
        </div>
      </header>
      <main className="flex overflow-hidden flex-1">
        <div className="flex-1 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Cue List</h2>
            <button 
              onClick={() => handleAddCue()}
              className="inline-flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Cue
            </button>
          </div>
          <div className="flex items-center mb-4 space-x-2">
            <input
              type="text"
              className="flex-grow px-3 py-2 rounded-md border dark:bg-gray-800"
              placeholder="Search cues..."
            />
          </div>
          <div className="overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                Loading cues...
              </div>
            ) : cues.length === 0 ? (
              <div className="flex justify-center items-center p-4">
                No cues found. Click "Add Cue" to create one.
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="w-[50px] text-left p-2"></th>
                    <th className="w-[80px] text-left p-2">Cue ID</th>
                    <th className="w-[100px] text-left p-2">Start Time</th>
                    <th className="w-[100px] text-left p-2">Run Time</th>
                    <th className="w-[100px] text-left p-2">End Time</th>
                    <th className="p-2 text-left">Activity</th>
                    <th className="w-[120px] text-left p-2">Graphics</th>
                    <th className="w-[120px] text-left p-2">Video</th>
                    <th className="w-[120px] text-left p-2">Audio</th>
                    <th className="w-[120px] text-left p-2">Lighting</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="w-[50px] text-left p-2"></th>
                  </tr>
                </thead>
                <tbody>
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
                  {cues.map((cue, index) => (
                    <React.Fragment key={cue.id}>
                      <tr className="border-b group hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <DropdownMenu.Root open={insertMenuOpen === cue.id} onOpenChange={(open) => setInsertMenuOpen(open ? cue.id : null)}>
                            <DropdownMenu.Trigger asChild>
                              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                className="min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg p-1 z-50"
                                sideOffset={5}
                              >
                                <DropdownMenu.Item
                                  className="text-sm px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  onSelect={() => handleInsertCue(cues[index - 1]?.id || null, cue.id)}
                                >
                                  <ChevronUp className="inline mr-2 w-4 h-4" />
                                  Insert Above
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  className="text-sm px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  onSelect={() => handleInsertCue(cue.id, cues[index + 1]?.id || null)}
                                >
                                  <ChevronDown className="inline mr-2 w-4 h-4" />
                                  Insert Below
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </td>
                        <td className="p-2">{cue.cue_number}</td>
                        <td className="p-2">{cue.start_time}</td>
                        <td className="p-2">{cue.run_time}</td>
                        <td className="p-2">{cue.end_time}</td>
                        <td className="p-2">{cue.activity}</td>
                        <td className="p-2">{cue.graphics}</td>
                        <td className="p-2">{cue.video}</td>
                        <td className="p-2">{cue.audio}</td>
                        <td className="p-2">{cue.lighting}</td>
                        <td className="p-2">{cue.notes}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditCue(cue)}
                              className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCue(cue.id)}
                              className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <CueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInsertPosition(null);
          setCurrentIndex(undefined);
        }}
        onSubmit={handleSubmitCue}
        initialData={selectedCue}
        mode={modalMode}
        cues={cues}
        currentIndex={currentIndex}
      />
    </div>
  );
}
