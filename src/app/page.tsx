"use client";

import React from 'react';
import MainContainer from '@/components/MainContainer';
import { Search, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

const shows = [
  {
    id: 1,
    title: 'MMSD Show',
    date: '2024-01-21',
    eventDate: '2024-02-15', 
    cueCount: 24,
    lastModified: '2024-01-21T15:45:00',
    cueListId: 'your-cuelist-id' 
  }
];

export default function Home() {
  return (
    <MainContainer>
      <div className="py-6 space-y-6">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">CueFlow Dashboard</h1>
          <ThemeToggle />
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search shows..."
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
        </div>

        {/* Shows Grid */}
        <div className="grid grid-cols-1 gap-6">
          {shows.map((show) => (
            <div
              key={show.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{show.title}</h3>
                    <div className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Event Date: {new Date(show.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Last modified: {new Date(show.lastModified).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/cue-list/${show.cueListId}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                  >
                    View Cues
                  </Link>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {show.cueCount} cues
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {new Date(show.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainContainer>
  );
}
