export interface Cue {
  id: string;           // System ID (UUID)
  display_id: string;   // Display ID (e.g., CUE-001)
  created_at?: string;
  updated_at?: string;
  show_id: string;
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

export type NewCue = Omit<Cue, 'id' | 'display_id' | 'created_at' | 'updated_at'>;
