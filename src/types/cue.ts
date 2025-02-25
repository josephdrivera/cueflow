export interface Cue {
  id: string;
  day_cue_list_id?: string;
  show_id?: string;
  cue_number: string;
  display_id?: string;  
  start_time: string;
  run_time: string;
  end_time: string;
  activity: string;
  graphics?: string;
  video?: string;
  audio?: string;
  lighting?: string;
  notes?: string;
  previous_cue_id?: string;
  next_cue_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewCue {
  day_cue_list_id?: string;
  show_id?: string;
  cue_number: string;
  display_id?: string;
  start_time: string;
  run_time: string;
  end_time: string;
  activity: string;
  graphics?: string;
  video?: string;
  audio?: string;
  lighting?: string;
  notes?: string;
  previous_cue_id?: string;
  next_cue_id?: string;
}

export interface DayCueList {
  id: string;
  show_id: string;
  name: string;
  date: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}