import { supabase } from '@/lib/supabase';
import { Cue, NewCue } from '@/types/cue';

const TABLE_NAME = 'cues';

export async function getAllCues(): Promise<Cue[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCue(cue: NewCue): Promise<Cue> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([cue])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCue(id: string, cue: Partial<NewCue>): Promise<Cue> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(cue)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCue(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) throw error;
}
