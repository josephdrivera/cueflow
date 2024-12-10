"use client"

import * as React from "react"
import { Clock, Edit2, Plus, Settings, X } from 'lucide-react'

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
                  <th className="w-[100px] text-left p-2">Time</th>
                  <th className="text-left p-2">Description</th>
                  <th className="w-[150px] text-left p-2">Role</th>
                  <th className="w-[50px] text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "Q1", time: "00:00:00", description: "Show Start", role: "All" },
                  { id: "Q2", time: "00:01:30", description: "Intro Video", role: "AV Tech" },
                  { id: "Q3", time: "00:03:00", description: "Welcome Speech", role: "Host" },
                  { id: "Q4", time: "00:10:00", description: "Lighting Change", role: "Lighting Tech" },
                ].map((cue, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{cue.id}</td>
                    <td className="p-2">{cue.time}</td>
                    <td className="p-2">{cue.description}</td>
                    <td className="p-2">{cue.role}</td>
                    <td className="p-2">
                      <button 
                        onClick={() => handleEdit(cue)}
                        className="p-1 hover:bg-gray-100 rounded-md"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {showDetails && (
          <div className="flex-1 p-4">
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
                <label className="mb-2 block text-sm font-medium">Time</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.time || ""}
                  placeholder="Enter time (HH:MM:SS)"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.description || ""}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Role</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={editingCue?.role || ""}
                  placeholder="Enter role"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  className="w-full rounded-md border p-2"
                  rows={4}
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
