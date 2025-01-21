'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';

interface Cue {
  id: string;
  start_time: string;
  run_time: string;
  end_time: string;
  activity: string;
  graphics?: string;
  video?: string;
  audio?: string;
  lighting?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  cue_number: string;
  previous_cue_id?: string;
  next_cue_id?: string;
  show_id: string;
  cue_list_id?: string;
  day_cue_list_id?: string;
  display_id: string;
}

interface CueListProps {
  showId: string;
}

export function CueList({ showId }: CueListProps) {
  const [cues, setCues] = React.useState<Cue[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalRunningTime, setTotalRunningTime] = React.useState<string>('0:00');

  React.useEffect(() => {
    const fetchCues = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('cues')
          .select('*')
          .eq('show_id', showId)
          .order('cue_number', { ascending: true });

        if (fetchError) throw fetchError;

        if (data) {
          setCues(data);
          calculateTotalRunningTime(data);
        }
      } catch (err) {
        console.error('Error fetching cues:', err);
        setError('Failed to load cues. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCues();
  }, [showId]);

  const calculateTotalRunningTime = (cueList: Cue[]) => {
    // Calculate total running time from the cues
    let totalMinutes = 0;
    cueList.forEach(cue => {
      if (cue.run_time) {
        const [minutes] = cue.run_time.split(':').map(Number);
        totalMinutes += minutes || 0;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTotalRunningTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
  };

  if (isLoading) {
    return <div className="py-12 text-center">Loading cues...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-gray-300 bg-gray-900">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-3 text-left">Cue ID</th>
            <th className="px-4 py-3 text-left">Start Time</th>
            <th className="px-4 py-3 text-left">Run Time</th>
            <th className="px-4 py-3 text-left">End Time</th>
            <th className="px-4 py-3 text-left">Activity</th>
            <th className="px-4 py-3 text-left">Graphics</th>
            <th className="px-4 py-3 text-left">Video</th>
            <th className="px-4 py-3 text-left">Audio</th>
            <th className="px-4 py-3 text-left">Lighting</th>
            <th className="px-4 py-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {cues.map((cue) => (
            <tr key={cue.id} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="px-4 py-3">{cue.cue_number}</td>
              <td className="px-4 py-3">{cue.start_time}</td>
              <td className="px-4 py-3">{cue.run_time}</td>
              <td className="px-4 py-3">{cue.end_time}</td>
              <td className="px-4 py-3">{cue.activity}</td>
              <td className="px-4 py-3">{cue.graphics || '-'}</td>
              <td className="px-4 py-3">{cue.video || '-'}</td>
              <td className="px-4 py-3">{cue.audio || '-'}</td>
              <td className="px-4 py-3">{cue.lighting || '-'}</td>
              <td className="px-4 py-3">{cue.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between px-4 mt-4 text-gray-300">
        <div>Total Cues: {cues.length}</div>
        <div>Total Running Time: {totalRunningTime}</div>
        <div>Current Time: {new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
