'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Settings } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { CueModal } from './CueModal';
import { Cue } from '../types/cue';

interface CueListProps {
  showId: string;
  cueListId?: string;
}

export function CueList({ showId, cueListId }: CueListProps) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRunningTime, setTotalRunningTime] = useState<string>('0:00');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(cues);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCues(items);
  };

  useEffect(() => {
    const fetchCues = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If cueListId is provided, use it, otherwise fall back to show_id
        let query;
        if (cueListId) {
          query = supabase
            .from('cues')
            .select('*')
            .eq('day_cue_list_id', cueListId);
        } else {
          query = supabase
            .from('cues')
            .select('*')
            .eq('show_id', showId);
        }

        const { data, error: fetchError } = await query.order('cue_number', { ascending: true });

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
  }, [showId, cueListId]);

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
    <div className="bg-white dark:bg-gray-900">
      <div className="px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              Current Cue List
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Plus className="mr-2 w-5 h-5" />
              Add Cue
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto w-full bg-white rounded-lg border border-gray-200 shadow dark:bg-gray-800 dark:border-gray-700">
            <Droppable droppableId="cues">
              {(provided) => (
                <table className="min-w-full text-gray-700 dark:text-gray-300" {...provided.droppableProps} ref={provided.innerRef}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800">
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
                    {cues.map((cue, index) => (
                      <Draggable key={cue.id} draggableId={cue.id} index={index}>
                        {(provided) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="border-b border-gray-200 cursor-move dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>

            <div className="flex justify-between px-4 py-3 text-gray-700 bg-gray-50 border-t border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800">
              <div>Total Cues: {cues.length}</div>
              <div>Total Running Time: {totalRunningTime}</div>
              <div>Current Time: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && (
        <CueModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (newCue) => {
            try {
              // Use day_cue_list_id if available, otherwise use legacy format
              const cueData = {
                ...newCue,
                day_cue_list_id: cueListId,
                show_id: !cueListId ? showId : undefined
              };

              const { data, error } = await supabase
                .from('cues')
                .insert([cueData])
                .select()
                .single();

              if (error) throw error;
              if (data) {
                setCues([...cues, data]);
              }
              
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error adding cue:', error);
              alert('Failed to add cue. Please try again.');
            }
          }}
          mode="add"
          cues={cues}
          showId={showId}
        />
      )}
    </div>
  );
}