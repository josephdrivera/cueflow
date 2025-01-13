export interface Cue {
  id: string;           // System ID (UUID)
  display_id: string;   // Display ID (e.g., CUE-001)
  created_at?: string;
  updated_at?: string;
  show_id: string;
  cue_list_id: string; // Reference to the day's cue list
  cue_number: string;
  start_time: string;  // Required time field
  run_time: string;    // Required time field
  end_time: string;    // Required time field
  activity?: string;
  graphics?: string;
  video?: string;
  audio?: string;
  lighting?: string;
  notes?: string;
  previous_cue_id?: string | null;
  next_cue_id?: string | null;
}

export interface DayCueList {
  id: string;           // System ID (UUID)
  show_id: string;      // Reference to the show
  name: string;         // Name of the cue list (e.g., "Day 1", "Opening Night")
  date: string;         // Date for this cue list
  created_at?: string;
  updated_at?: string;
}

export type NewCue = Omit<Cue, 'id' | 'created_at' | 'updated_at'>;
export type NewDayCueList = Omit<DayCueList, 'id' | 'created_at' | 'updated_at'>;
