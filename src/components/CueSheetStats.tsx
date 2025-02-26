"use client";

import React from 'react';
import { Cue } from "@/types/cue";

interface CueSheetStatsProps {
  cues: Cue[];
}

export function CueSheetStats({ cues }: CueSheetStatsProps) {
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

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex justify-between">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total Cues:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-gray-300">{totals.totalCues}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Total Run Time:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-gray-300">{totals.formattedTotalTime}</span>
        </div>
      </div>
    </div>
  );
}
