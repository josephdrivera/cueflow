'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Plus, Edit2 } from 'lucide-react';

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
        const { error } = await supabase
          .from('day_cue_lists')
          .update({
            name: newName.trim(),
            date: newDate,
          })
          .eq('id', editingCueList.id);

        if (error) throw error;
      } else {
        // Add new cue list
        const { data, error } = await supabase
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

        if (error) throw error;
        
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
          className="flex items-center justify-between w-64 px-4 py-2 bg-gray-800 rounded-md text-white"
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
          className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Cue List
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-64 mt-2 bg-gray-800 rounded-md shadow-lg">
          <div className="py-1">
            {cueLists.map((cueList) => (
              <div key={cueList.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-700 group">
                <button
                  onClick={() => handleSelectCueList(cueList)}
                  className="flex-grow text-left text-white"
                >
                  {formatCueListDisplay(cueList.name, cueList.date)}
                </button>
                <button
                  onClick={() => handleEditCueList(cueList)}
                  className="opacity-0 group-hover:opacity-100 p-1"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium text-white mb-4">
              {editingCueList ? 'Edit Cue List' : 'Add New Cue List'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white px-3 py-2"
                  placeholder="e.g., day one"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white px-3 py-2"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end space-x-3 mt-6">
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
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingCueList ? 'Save Changes' : 'Add Cue List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
