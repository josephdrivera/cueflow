"use client"

import * as React from "react"
import { Clock, Edit2, Plus, Settings, X } from 'lucide-react'
import { ThemeToggle } from "./ThemeToggle"

export default function CueSheetEditor() {
  const [showDetails, setShowDetails] = React.useState(false)
  const [editingCue, setEditingCue] = React.useState(null)
  const [isAdding, setIsAdding] = React.useState(false)

  const handleAddNew = () => {
    setEditingCue(null)
    setIsAdding(true)
    setShowDetails(true)
  }

  const handleEdit = (cue) => {
    setEditingCue(cue)
    setIsAdding(false)
    setShowDetails(true)
  }

  const handleClose = () => {
    setShowDetails(false)
    setEditingCue(null)
    setIsAdding(false)
  }

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
        <div className={showDetails ? "w-1/2 border-r p-4" : "flex-1 p-4"}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cue List</h2>
            <button 
              onClick={handleAddNew}
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
                {[
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
                ].map((cue, index) => (
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
                        onClick={() => handleEdit(cue)}
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
        {showDetails && (
          <div className="w-1/2 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {isAdding ? "Add New Cue" : "Edit Cue"}
              </h2>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Cue ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.id || ""}
                  placeholder="Enter Cue ID"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Start Time</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.startTime || ""}
                  placeholder="Enter start time (HH:MM:SS)"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Run Time</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.runTime || ""}
                  placeholder="Enter run time (HH:MM:SS)"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">End Time</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.endTime || ""}
                  placeholder="Enter end time (HH:MM:SS)"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Activity</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.activity || ""}
                  placeholder="Enter activity"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Graphics</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.graphics || ""}
                  placeholder="Enter graphics"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Video</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.video || ""}
                  placeholder="Enter video"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Audio</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.audio || ""}
                  placeholder="Enter audio"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Lighting</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.lighting || ""}
                  placeholder="Enter lighting"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  className="w-full rounded-md border p-2"
                  rows={4}
                  defaultValue={editingCue?.notes || ""}
                  placeholder="Enter any additional notes"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 border rounded-md bg-blue-500 text-white hover:bg-blue-600">
                <Edit2 className="mr-2 h-4 w-4" />
                {isAdding ? "Add Cue" : "Update Cue"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
