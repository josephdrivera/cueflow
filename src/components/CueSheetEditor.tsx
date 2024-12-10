"use client"

import * as React from "react"
import { Clock, Edit2, Plus, Settings, X } from 'lucide-react'
import { ThemeToggle } from "./ThemeToggle"
import { CueModal } from './CueModal';

interface Cue {
  id: string;
  startTime: string;
  runTime: string;
  endTime: string;
  activity: string;
  graphics: string;
  video: string;
  audio: string;
  lighting: string;
  notes: string;
}

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

  const handleAddCue = () => {
    setModalMode('add');
    setSelectedCue(undefined);
    setIsModalOpen(true);
  };

  const handleEditCue = (cue: Cue) => {
    setModalMode('edit');
    setSelectedCue(cue);
    setIsModalOpen(true);
  };

  const handleSubmitCue = async (cue: Cue) => {
    try {
      if (modalMode === 'add') {
        const newCue = cue;
        setCues([...cues, newCue]);
      } else {
        const updatedCue = cue;
        setCues(cues.map((c) => (c.id === updatedCue.id ? updatedCue : c)));
      }
    } catch (error) {
      console.error('Error saving cue:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">CueFlow: Event Name</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button className="inline-flex items-center px-4 py-2 border rounded-md">
            <Clock className="mr-2 h-4 w-4" />
            Live Mode
          </button>
          <button className="inline-flex items-center px-4 py-2 border rounded-md">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cue List</h2>
            <button 
              onClick={handleAddCue}
              className="inline-flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Cue
            </button>
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <input
              type="text"
              className="flex-grow px-3 py-2 border rounded-md"
              placeholder="Search cues..."
            />
          </div>
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-[80px] text-left p-2">Cue ID</th>
                  <th className="w-[100px] text-left p-2">Start Time</th>
                  <th className="w-[100px] text-left p-2">Run Time</th>
                  <th className="w-[100px] text-left p-2">End Time</th>
                  <th className="text-left p-2">Activity</th>
                  <th className="w-[120px] text-left p-2">Graphics</th>
                  <th className="w-[120px] text-left p-2">Video</th>
                  <th className="w-[120px] text-left p-2">Audio</th>
                  <th className="w-[120px] text-left p-2">Lighting</th>
                  <th className="text-left p-2">Notes</th>
                  <th className="w-[50px] text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {cues.map((cue, index) => (
                  <tr key={index} className="border-b hover:bg-accent hover:text-accent-foreground">
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
                        className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <CueModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitCue}
          initialData={selectedCue}
          mode={modalMode}
        />
      </main>
    </div>
  )
}
