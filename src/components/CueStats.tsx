"use client";

import React from 'react';

interface CueStatsProps {
  totalCues: number;
  formattedTotalTime: string;
}

export function CueStats({ totalCues, formattedTotalTime }: CueStatsProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  return (
    <div className="p-4 mt-4 bg-white rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <div className="text-gray-600 dark:text-gray-400">
          Total Cues: <span className="font-medium text-gray-900 dark:text-gray-300">{totalCues}</span>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Total Running Time: <span className="font-medium text-gray-900 dark:text-gray-300">{formattedTotalTime}</span>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Current Time: <span className="font-medium text-gray-900 dark:text-gray-300">
            {formatDate('2025-01-13')}
          </span>
        </div>
      </div>
    </div>
  );
}
