"use client";

import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { ThemeToggle } from "./ThemeToggle";
import { DayCueList } from "@/types/dayCueList";
import Link from 'next/link';

interface CueSheetControlsProps {
  selectedCueList: DayCueList | null;
  cueLists: DayCueList[];
  onCueListSelect: (cueList: DayCueList | null) => void;
  onAddCueList: () => void;
  onAddCue: () => void;
}

export function CueSheetControls({
  selectedCueList,
  cueLists,
  onCueListSelect,
  onAddCueList,
  onAddCue
}: CueSheetControlsProps) {
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
}
