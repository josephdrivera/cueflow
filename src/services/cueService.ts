import { supabase } from '@/lib/supabase';
import { Cue, NewCue } from '@/types/cue';

const TABLE_NAME = 'cues';

// Helper functions
export async function getAllCues(showId: string): Promise<Cue[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('show_id', showId)
    .order('cue_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCueById(id: string): Promise<Cue> { 
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCue(cue: NewCue): Promise<Cue> {
  // Get the highest cue number for the given prefix
  const prefix = cue.cue_number.charAt(0);
  const { data: existingCues, error: queryError } = await supabase
    .from(TABLE_NAME)
    .select('cue_number')
    .eq('show_id', cue.show_id)
    .ilike('cue_number', `${prefix}%`)
    .order('cue_number', { ascending: false })
    .limit(1);

  if (queryError) throw queryError;

  // Generate the next cue number
  let nextNumber = 101;
  if (existingCues && existingCues.length > 0) {
    const lastNumber = parseInt(existingCues[0].cue_number.substring(1));
    nextNumber = lastNumber + 1;
  }

  // Format the new cue number (e.g., 'A101')
  const newCueNumber = `${prefix}${nextNumber.toString()}`;
  const newCue = { ...cue, cue_number: newCueNumber };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([newCue])
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

export async function insertCueBetween(
  showId: string,
  previousCueId: string | null,
  nextCueId: string | null,
  cue: Omit<NewCue, 'cue_number'>
): Promise<Cue> {
  // Get the surrounding cues
  const [previousCue, nextCue] = await Promise.all([
    previousCueId ? getCueById(previousCueId) : null,
    nextCueId ? getCueById(nextCueId) : null,
  ]);

  // Determine the new cue number
  let newCueNumber: string;
  if (!previousCue && !nextCue) {
    // First cue in the show
    newCueNumber = 'A101';
  } else if (!previousCue) {
    // Insert at beginning
    newCueNumber = generateCueNumberBefore(nextCue!.cue_number);
  } else if (!nextCue) {
    // Insert at end
    newCueNumber = generateCueNumberAfter(previousCue.cue_number);
  } else {
    // Insert between
    newCueNumber = generateCueNumberBetween(previousCue.cue_number, nextCue.cue_number);
  }

  // Create the new cue
  const newCue = await createCue({
    ...cue,
    show_id: showId,
    cue_number: newCueNumber,
    previous_cue_id: previousCueId,
    next_cue_id: nextCueId,
  });

  // Update surrounding cues
  await Promise.all([
    previousCueId && updateCue(previousCueId, { next_cue_id: newCue.id }),
    nextCueId && updateCue(nextCueId, { previous_cue_id: newCue.id }),
  ]);

  return newCue;
}

// Helper functions for cue number generation

function generateCueNumberBefore(number: string): string {
  const prefix = number.charAt(0);
  const numeric = parseInt(number.substring(1));
  if (numeric > 101) {
    return `${prefix}${(numeric - 1).toString()}`;
  }
  // If we can't decrement, we need a new prefix
  const newPrefix = String.fromCharCode(prefix.charCodeAt(0) - 1);
  return `${newPrefix}999`;
}

function generateCueNumberAfter(number: string): string {
  const prefix = number.charAt(0);
  const numeric = parseInt(number.substring(1));
  if (numeric < 999) {
    return `${prefix}${(numeric + 1).toString()}`;
  }
  // If we can't increment, we need a new prefix
  const newPrefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
  return `${newPrefix}101`;
}

function generateCueNumberBetween(before: string, after: string): string {
  const beforePrefix = before.charAt(0);
  const afterPrefix = after.charAt(0);
  const beforeNumeric = parseInt(before.substring(1));
  const afterNumeric = parseInt(after.substring(1));

  if (beforePrefix === afterPrefix) {
    if (afterNumeric - beforeNumeric > 1) {
      // There's space between the numbers
      const middle = Math.floor((beforeNumeric + afterNumeric) / 2);
      return `${beforePrefix}${middle.toString()}`;
    }
    // No space between numbers, need to use a new prefix
    const newPrefix = String.fromCharCode(beforePrefix.charCodeAt(0) + 1);
    return `${newPrefix}101`;
  }

  // Different prefixes, use the first prefix with the next number
  return generateCueNumberAfter(before);
}
