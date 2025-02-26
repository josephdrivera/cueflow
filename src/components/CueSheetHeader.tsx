"use client";

import React, { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';
import { Show, updateShow } from "@/services/showService";
import { CueSheetControls } from './CueSheetControls';
import { DayCueList } from "@/types/dayCueList";

interface CueSheetHeaderProps {
  show: Show | null;
  selectedCueList: DayCueList | null;
  cueLists: DayCueList[];
  onCueListSelect: (cueList: DayCueList | null) => void;
  onAddCueList: () => void;
  onAddCue: () => void;
  onShowUpdate: (updatedShow: Show) => void;
}

export function CueSheetHeader({
  show,
  selectedCueList,
  cueLists,
  onCueListSelect,
  onAddCueList,
  onAddCue,
  onShowUpdate
}: CueSheetHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const handleUpdateShowTitle = async () => {
    if (!show || !editedTitle.trim()) return;
    
    try {
      const updatedShow = await updateShow(show.id, { title: editedTitle.trim() });
      onShowUpdate(updatedShow);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating show title:', error);
    }
  };

  const startEditingTitle = () => {
    if (!show) return;
    setEditedTitle(show.title);
    setIsEditingTitle(true);
  };

  return (
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
        <CueSheetControls
          selectedCueList={selectedCueList}
          cueLists={cueLists}
          onCueListSelect={onCueListSelect}
          onAddCueList={onAddCueList}
          onAddCue={onAddCue}
        />
      </div>
    </header>
  );
}
