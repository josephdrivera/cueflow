export interface Cue {
  id: string;
  start_time: string;
  run_time: string;
  end_time: string;
  activity: string;
  graphics: string;
  video: string;
  audio: string;
  lighting: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export type NewCue = Omit<Cue, 'id' | 'created_at' | 'updated_at'>;
