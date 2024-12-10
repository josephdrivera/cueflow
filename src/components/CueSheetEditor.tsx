"use client"

import * as React from "react"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Clock, Edit2, Plus, Settings, X, ChevronDown, ChevronUp } from 'lucide-react'
import { ThemeToggle } from "./ThemeToggle"
import { CueModal } from './CueModal';
import { Cue } from "@/types/cue";
import { insertCueBetween } from "@/services/cueService";
import { cn } from "@/lib/utils";

export default function CueSheetEditor() {
  const [cues, setCues] = React.useState<Cue[]>([
    {
      id: "Q1",
      startTime: "00:00:00",
      runTime: "00:01:30",
      endTime: "00:01:30",
      activity: "Show Start",
      graphics: "Title Slide",
      video: "-",
      audio: "Intro Music",
      lighting: "House Lights",
      notes: "Ensure house lights at 50%"
    },
    {
      id: "Q2",
      startTime: "00:01:30",
      runTime: "00:01:30",
      endTime: "00:03:00",
      activity: "Intro Video",
      graphics: "-",
      video: "Welcome.mp4",
      audio: "Video Audio",
      lighting: "Stage Dark",
      notes: "Fade house lights to 0%"
    },
    {
      id: "Q3",
      startTime: "00:03:00",
      runTime: "00:07:00",
      endTime: "00:10:00",
      activity: "Welcome Speech",
      graphics: "Speaker Lower Third",
      video: "-",
      audio: "Mic 1",
      lighting: "Stage Wash",
      notes: "Speaker enters from stage right"
    },
    {
      id: "Q4",
      startTime: "00:10:00",
      runTime: "00:02:00",
      endTime: "00:12:00",
      activity: "Transition",
      graphics: "Transition Slide",
      video: "-",
      audio: "Transition Music",
      lighting: "Color Wash",
      notes: "Smooth fade to next segment"
    },
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCue, setSelectedCue] = React.useState<Cue | undefined>();
  const [modalMode, setModalMode] = React.useState<'add' | 'edit'>('add');
  const [insertPosition, setInsertPosition] = React.useState<{
    previousId: string | null;
    nextId: string | null;
  } | null>(null);
  const [insertMenuOpen, setInsertMenuOpen] = React.useState<string | null>(null);

  const handleAddCue = () => {
    setModalMode('add');
    setSelectedCue(undefined);
    setInsertPosition(null);
    setIsModalOpen(true);
  };

  const handleEditCue = (cue: Cue) => {
    setModalMode('edit');
    setSelectedCue(cue);
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

  const handleSubmitCue = async (cue: Cue) => {
    try {
      if (modalMode === 'add') {
        if (insertPosition) {
          // Insert between cues
          const newCue = await insertCueBetween(
            cue.show_id,
            insertPosition.previousId,
            insertPosition.nextId,
            cue
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
          const newCue = await insertCueBetween(
            cue.show_id,
            cues[cues.length - 1]?.id || null,
            null,
            cue
          );
          setCues([...cues, newCue]);
        }
      } else {
        // Edit existing cue
        const updatedCue = cue;
        setCues(cues.map((c) => (c.id === updatedCue.id ? updatedCue : c)));
      }
    } catch (error) {
      console.error('Error saving cue:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">CueFlow: Event Name</h1>
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
              onClick={handleAddCue}
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
                      onClick={() => handleInsertCue(null, cues[0]?.id || null)}
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
                      <td className="p-2">{cue.id}</td>
                      <td className="p-2">{cue.startTime}</td>
                      <td className="p-2">{cue.runTime}</td>
                      <td className="p-2">{cue.endTime}</td>
                      <td className="p-2">{cue.activity}</td>
                      <td className="p-2">{cue.graphics}</td>
                      <td className="p-2">{cue.video}</td>
                      <td className="p-2">{cue.audio}</td>
                      <td className="p-2">{cue.lighting}</td>
                      <td className="p-2">{cue.notes}</td>
                      <td className="p-2">
                        <button
                          onClick={() => handleEditCue(cue)}
                          className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <CueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInsertPosition(null);
        }}
        onSubmit={handleSubmitCue}
        initialData={selectedCue}
        mode={modalMode}
      />
    </div>
  );
}
