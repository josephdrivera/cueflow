"use client";

import React from 'react';
import { Cue } from "@/types/cue";
import { GripVertical, Edit2, Plus, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from "@/lib/supabase";
import { validateCueNumber, generateCueNumberBetween, ensureUniqueCueNumber } from '@/utils/cueNumbering';

interface SortableCueRowProps {
  cue: Cue;
  index: number;
  onEdit: (cue: Cue) => void;
  onDelete: (id: string) => void;
}

function SortableCueRow({ cue, index, onEdit, onDelete }: SortableCueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: cue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="p-2">
        <button 
          className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.cue_number}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.start_time}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.run_time}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.end_time}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.activity}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.graphics}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.video}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.audio}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.lighting}</td>
      <td className="p-2 text-gray-900 dark:text-gray-300">{cue.notes}</td>
      <td className="p-2">
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(cue)}
            className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(cue.id)}
            className="p-1 text-red-500 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface SortableCueTableProps {
  cues: Cue[];
  selectedCueListId: string | null;
  showBorders: boolean;
  onEditCue: (cue: Cue) => void;
  onDeleteCue: (id: string) => void;
  onAddCue: (index?: number) => void;
  onCuesChange: (newCues: Cue[]) => void;
}

export function SortableCueTable({
  cues,
  selectedCueListId,
  showBorders,
  onEditCue,
  onDeleteCue,
  onAddCue,
  onCuesChange
}: SortableCueTableProps) {
  const tableRef = React.useRef<HTMLTableElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    try {
      if (!selectedCueListId) {
        console.error('No cue list ID available');
        return;
      }

      const oldIndex = cues.findIndex((cue) => cue.id === active.id);
      const newIndex = cues.findIndex((cue) => cue.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find cues to swap:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
        return;
      }

      console.log('Moving cue from index', oldIndex, 'to', newIndex);
      const newCues = arrayMove(cues, oldIndex, newIndex);
      
      // Get the surrounding cue numbers for the new position
      const prevCue = newIndex > 0 ? newCues[newIndex - 1] : null;
      const nextCue = newIndex < newCues.length - 1 ? newCues[newIndex + 1] : null;
      
      let newCueNumber;
      if (!prevCue) {
        // If it's the first cue
        newCueNumber = nextCue ? generateCueNumberBetween(null, nextCue.cue_number) : 'A101';
      } else if (!nextCue) {
        // If it's the last cue
        newCueNumber = generateCueNumberBetween(prevCue.cue_number, null);
      } else {
        // If it's between two cues
        newCueNumber = generateCueNumberBetween(prevCue.cue_number, nextCue.cue_number);
      }

      // Ensure the generated cue number is unique
      const existingCueNumbers = cues.map(cue => cue.cue_number);
      newCueNumber = ensureUniqueCueNumber(newCueNumber, existingCueNumbers);

      if (!validateCueNumber(newCueNumber)) {
        throw new Error(`Generated invalid cue number: ${newCueNumber}`);
      }

      console.log('Generated new cue number:', newCueNumber);

      // First, set a temporary cue number to avoid unique constraint
      const tempCueNumber = `TEMP-${Date.now()}-${active.id}`;
      await supabase
        .from('cues')
        .update({ cue_number: tempCueNumber })
        .eq('id', active.id);

      // Then update to the final cue number
      const { data: updatedCue, error: updateError } = await supabase
        .from('cues')
        .update({ cue_number: newCueNumber })
        .eq('id', active.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cue:', updateError);
        // Attempt to restore the original cue number
        const originalCue = cues[oldIndex];
        if (originalCue) {
          await supabase
            .from('cues')
            .update({ cue_number: originalCue.cue_number })
            .eq('id', active.id);
        }
        throw updateError;
      }
      
      if (!updatedCue) {
        console.error('No cue data returned from update');
        throw new Error('Failed to update cue');
      }

      // Refresh the cues list to get the proper order
      const { data: refreshedCues, error: refreshError } = await supabase
        .from('cues')
        .select('*')
        .eq('day_cue_list_id', selectedCueListId)
        .order('cue_number');

      if (refreshError) {
        console.error('Error refreshing cues:', refreshError);
        throw refreshError;
      }

      if (!refreshedCues) {
        console.error('No cues returned from refresh');
        throw new Error('Failed to refresh cues');
      }

      console.log('Successfully updated cue order');
      onCuesChange(refreshedCues);
    } catch (error) {
      console.error('Error updating cue order:', error);
      // Refresh the cues list to ensure consistent state
      try {
        const { data: refreshedCues } = await supabase
          .from('cues')
          .select('*')
          .eq('day_cue_list_id', selectedCueListId)
          .order('cue_number');
        if (refreshedCues) {
          onCuesChange(refreshedCues);
        }
      } catch (refreshError) {
        console.error('Error refreshing cues after error:', refreshError);
      }
    }
  };

  return (
    <div className="overflow-auto bg-white rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table ref={tableRef} className={cn("min-w-full", showBorders && "border-collapse [&_td]:border-r [&_th]:border-r dark:[&_td]:border-gray-800 dark:[&_th]:border-gray-800 [&_td]:border-gray-200 [&_th]:border-gray-200 [&_tr_td:last-child]:border-0 [&_tr_th:last-child]:border-0")}>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="w-[50px] text-left p-2 text-gray-600 dark:text-gray-400"></th>
              <th className="w-[80px] text-left p-2 text-gray-600 dark:text-gray-400">Cue ID</th>
              <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">Start Time</th>
              <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">Run Time</th>
              <th className="w-[100px] text-left p-2 text-gray-600 dark:text-gray-400">End Time</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Activity</th>
              <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Graphics</th>
              <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Video</th>
              <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Audio</th>
              <th className="w-[120px] text-left p-2 text-gray-600 dark:text-gray-400">Lighting</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Notes</th>
              <th className="w-[50px] text-left p-2 text-gray-600 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Insert button before first cue */}
            <tr>
              <td colSpan={12} className="p-1">
                <button
                  onClick={() => onAddCue(0)}
                  className="w-full py-0.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <Plus className="mx-auto w-3 h-3" />
                </button>
              </td>
            </tr>
            <SortableContext items={cues.map(cue => cue.id)} strategy={verticalListSortingStrategy}>
              {cues.map((cue, index) => (
                <SortableCueRow
                  key={cue.id}
                  cue={cue}
                  index={index}
                  onEdit={onEditCue}
                  onDelete={onDeleteCue}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
