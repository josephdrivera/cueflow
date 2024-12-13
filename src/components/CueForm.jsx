'use client';

import React, { useState } from 'react';
import './globals.css';

const CueForm = () => {
  const [cueData, setCueData] = useState({
    cueId: '',
    startTime: '',
    runTime: '',
    endTime: '',
    activity: '',
    graphics: '',
    video: '',
    audio: '',
    lighting: '',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCueData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cueData),
      });

      if (!response.ok) {
        throw new Error('Failed to create cue');
      }

      // Reset form after successful submission
      setCueData({
        cueId: '',
        startTime: '',
        runTime: '',
        endTime: '',
        activity: '',
        graphics: '',
        video: '',
        audio: '',
        lighting: '',
        notes: '',
      });

      alert('Cue created successfully!');
    } catch (error) {
      console.error('Error creating cue:', error);
      alert('Failed to create cue. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-[#1e2128] rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">Add New Cue</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cueId" className="text-sm font-medium text-gray-100">
            Cue ID
          </label>
          <input
            type="text"
            id="cueId"
            name="cueId"
            value={cueData.cueId}
            onChange={handleInputChange}
            placeholder="e.g., A101"
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="startTime" className="text-sm font-medium text-gray-100">
            Start Time
          </label>
          <input
            type="text"
            id="startTime"
            name="startTime"
            value={cueData.startTime}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="runTime" className="text-sm font-medium text-gray-100">
            Run Time
          </label>
          <input
            type="text"
            id="runTime"
            name="runTime"
            value={cueData.runTime}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endTime" className="text-sm font-medium text-gray-100">
            End Time
          </label>
          <input
            type="text"
            id="endTime"
            name="endTime"
            value={cueData.endTime}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="activity" className="text-sm font-medium text-gray-100">
            Activity
          </label>
          <input
            type="text"
            id="activity"
            name="activity"
            value={cueData.activity}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="graphics" className="text-sm font-medium text-gray-100">
            Graphics
          </label>
          <input
            type="text"
            id="graphics"
            name="graphics"
            value={cueData.graphics}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="video" className="text-sm font-medium text-gray-100">
            Video
          </label>
          <input
            type="text"
            id="video"
            name="video"
            value={cueData.video}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="audio" className="text-sm font-medium text-gray-100">
            Audio
          </label>
          <input
            type="text"
            id="audio"
            name="audio"
            value={cueData.audio}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lighting" className="text-sm font-medium text-gray-100">
            Lighting
          </label>
          <input
            type="text"
            id="lighting"
            name="lighting"
            value={cueData.lighting}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-100">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={cueData.notes}
            onChange={handleInputChange}
            className="w-full bg-[#24272e] border border-[#2a2d35] rounded-md px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" className="px-4 py-2 rounded-md bg-[#24272e] text-gray-100 hover:bg-[#2a2d35]">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-gray-100 hover:bg-blue-700">
            Add Cue
          </button>
        </div>
      </form>
    </div>
  );
};

export default CueForm;
