'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';

interface CueList {
  id: string;
  name: string;
  date: string;
}

interface CueListManagerProps {
  showId: string;
  onSelectCueList: (cueListId: string) => void;
}

export function CueListManager({ showId, onSelectCueList }: CueListManagerProps) {
  const [cueLists, setCueLists] = useState<CueList[]>([]);
  const [selectedCueList, setSelectedCueList] = useState<CueList | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCueList, setEditingCueList] = useState<CueList | null>(null);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<CueList | null>(null);

  useEffect(() => {
    fetchCueLists();
  }, [showId]);

  const fetchCueLists = async () => {
    try {
      const { data, error } = await supabase
        .from('day_cue_lists')
        .select('*')
        .eq('show_id', showId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setCueLists(data);
        if (data.length > 0 && !selectedCueList) {
          setSelectedCueList(data[0]);
          onSelectCueList(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching cue lists:', err);
      setError('Failed to load cue lists');
    }
  };

  const handleAddCueList = () => {
    setEditingCueList(null);
    setNewName('');
    const today = new Date().toISOString().split('T')[0];
    setNewDate(today);
    setIsEditing(true);
    setIsDropdownOpen(false);
  };

  const handleEditCueList = (cueList: CueList) => {
    setEditingCueList(cueList);
    setNewName(cueList.name);
    setNewDate(cueList.date);
    setIsEditing(true);
    setIsDropdownOpen(false);
  };

  const handleDeleteCueList = (cueList: CueList) => {
    setDeleteConfirmation(cueList);
    setIsDropdownOpen(false);
  };

  const confirmDeleteCueList = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the cue list
      const { error: deleteError } = await supabase
        .from('day_cue_lists')
        .delete()
        .eq('id', deleteConfirmation.id);

      if (deleteError) throw deleteError;

      // Update the local state
      setCueLists(prevLists => prevLists.filter(list => list.id !== deleteConfirmation.id));
      
      // If the deleted cue list was selected, select another one
      if (selectedCueList?.id === deleteConfirmation.id) {
        const remainingLists = cueLists.filter(list => list.id !== deleteConfirmation.id);
        if (remainingLists.length > 0) {
          setSelectedCueList(remainingLists[0]);
          onSelectCueList(remainingLists[0].id);
        } else {
          setSelectedCueList(null);
          onSelectCueList('');
        }
      }
      
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting cue list:', err);
      setError('Failed to delete cue list');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCueListDisplay = (name: string, date: string) => {
    // Convert date from YYYY-MM-DD to the desired format
    const [year, month, day] = date.split('-');
    const formattedDate = `${year}-${month}-${day}`;
    return `${name.toLowerCase()} [${formattedDate}]`;
  };

  const handleSelectCueList = (cueList: CueList) => {
    setSelectedCueList(cueList);
    onSelectCueList(cueList.id);
    setIsDropdownOpen(false);
  };

  const handleSave = async () => {
    try {
      if (!newName.trim() || !newDate) {
        setError('Name and date are required');
        return;
      }

      if (editingCueList) {
        // Update existing cue list
        const { error: archiveError } = await supabase
          .from('day_cue_lists')
          .update({
            name: newName.trim(),
            date: newDate,
          })
          .eq('id', editingCueList.id);

        if (archiveError) {
          throw archiveError;
        }
      } else {
        // Add new cue list
        const { data, error: createError } = await supabase
          .from('day_cue_lists')
          .insert([
            {
              show_id: showId,
              name: newName.trim(),
              date: newDate,
            },
          ])
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        
        // Select the newly created cue list
        if (data) {
          setSelectedCueList(data);
          onSelectCueList(data.id);
        }
      }

      await fetchCueLists();
      setIsEditing(false);
      setEditingCueList(null);
      setError(null);
    } catch (err) {
      console.error('Error saving cue list:', err);
      setError('Failed to save cue list');
    }
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex justify-between items-center px-4 py-2 w-64 text-white bg-gray-800 rounded-md"
        >
          <span>
            {selectedCueList
              ? formatCueListDisplay(selectedCueList.name, selectedCueList.date)
              : 'Select Cue List'}
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        <button
          onClick={handleAddCueList}
          className="flex items-center px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
        >
          <Plus className="mr-2 w-5 h-5" />
          Add Cue List
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-gray-800 rounded-md shadow-lg">
          <div className="py-1">
            {cueLists.map((cueList) => (
              <div key={cueList.id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-700 group">
                <button
                  onClick={() => handleSelectCueList(cueList)}
                  className="flex-grow text-left text-white"
                >
                  {formatCueListDisplay(cueList.name, cueList.date)}
                </button>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCueList(cueList);
                    }}
                    className="p-1"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCueList(cueList);
                    }}
                    className="p-1"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isEditing && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 w-96 bg-gray-800 rounded-lg">
            <h3 className="mb-4 text-lg font-medium text-white">
              {editingCueList ? 'Edit Cue List' : 'Add New Cue List'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="block px-3 py-2 mt-1 w-full text-white bg-gray-900 rounded-md border-gray-700"
                  placeholder="e.g., day one"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="block px-3 py-2 mt-1 w-full text-white bg-gray-900 rounded-md border-gray-700"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingCueList(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingCueList ? 'Save Changes' : 'Add Cue List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 w-96 bg-gray-800 rounded-lg">
            <h3 className="mb-4 text-lg font-medium text-white">
              Delete Cue List
            </h3>
            
            <p className="mb-6 text-gray-300">
              Are you sure you want to delete the cue list "{deleteConfirmation.name}"? 
              This will permanently delete all cues associated with this list.
            </p>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCueList}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}