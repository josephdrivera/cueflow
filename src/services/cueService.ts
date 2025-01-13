import { supabase } from '@/lib/supabase';
import { Cue, NewCue } from '@/types/cue';
import { validateCueNumber } from '@/utils/cueNumbering';

const TABLE_NAME = 'cues';

// Helper functions
export async function getAllCues(showId: string): Promise<Cue[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('show_id', showId)
      .order('cue_number');

    if (error) {
      console.error('Error getting cues:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getAllCues:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
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
  try {
    // Validate the cue number format
    if (!validateCueNumber(cue.cue_number)) {
      throw new Error(`Invalid cue number format: ${cue.cue_number}`);
    }

    // Prepare the new cue data exactly as per schema
    const newCue = {
      show_id: cue.show_id,
      cue_number: cue.cue_number,
      start_time: cue.start_time,  
      run_time: cue.run_time,      
      end_time: cue.end_time,      
      activity: cue.activity ?? '',
      graphics: cue.graphics ?? '',
      video: cue.video ?? '',
      audio: cue.audio ?? '',
      lighting: cue.lighting ?? '',
      notes: cue.notes ?? '',
      previous_cue_id: cue.previous_cue_id ?? null,
      next_cue_id: cue.next_cue_id ?? null
    };

    console.log('Creating new cue:', newCue);
    const { data, error } = await supabase
      .from('cues')
      .insert([newCue])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating cue:', error);
      throw new Error(`Database error: ${error.message}${error.details ? ` - ${error.details}` : ''}`);
    }

    if (!data) {
      throw new Error('No data returned from cue creation');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createCue:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    throw error;
  }
}

export async function updateCue(id: string, cue: Partial<Cue>): Promise<Cue> {
  try {
    // If updating cue number, validate it first
    if (cue.cue_number && !validateCueNumber(cue.cue_number)) {
      throw new Error(`Invalid cue number format: ${cue.cue_number}`);
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        cue_number: cue.cue_number,
        start_time: cue.start_time,
        run_time: cue.run_time,
        end_time: cue.end_time,
        activity: cue.activity,
        graphics: cue.graphics,
        video: cue.video,
        audio: cue.audio,
        lighting: cue.lighting,
        notes: cue.notes,
        show_id: cue.show_id,
        previous_cue_id: cue.previous_cue_id,
        next_cue_id: cue.next_cue_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating cue:', error);
      throw new Error(`Database error: ${error.message}${error.details ? ` - ${error.details}` : ''}`);
    }

    if (!data) {
      throw new Error('No data returned from cue update');
    }

    return data;
  } catch (error: any) {
    console.error('Error updating cue:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function deleteCue(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting cue:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error in deleteCue:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
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

export async function checkDuplicateCueNumber(showId: string, cueNumber: string, excludeId?: string): Promise<boolean> {
  try {
    if (!showId || !cueNumber) {
      console.error('Missing required parameters:', { showId, cueNumber });
      return false;
    }

    let query = supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('show_id', showId)
      .eq('cue_number', cueNumber);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error checking duplicate cue number:', error);
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking duplicate cue number:', error);
    throw error;
  }
}

// Move a cue up by swapping with the previous cue
export async function moveCueUp(cue: Cue, previousCue: Cue): Promise<[Cue, Cue]> {
  try {
    console.log('Moving cue up:', { cue, previousCue });
    
    const tempCueNumber = cue.cue_number;
    
    // Update first cue
    const { data: firstUpdate, error: firstError } = await supabase
      .from(TABLE_NAME)
      .update({ cue_number: previousCue.cue_number })
      .eq('id', cue.id)
      .select()
      .single();

    if (firstError) {
      console.error('Error updating first cue:', firstError);
      throw firstError;
    }

    // Update second cue
    const { data: secondUpdate, error: secondError } = await supabase
      .from(TABLE_NAME)
      .update({ cue_number: tempCueNumber })
      .eq('id', previousCue.id)
      .select()
      .single();

    if (secondError) {
      console.error('Error updating second cue:', secondError);
      throw secondError;
    }

    if (!firstUpdate || !secondUpdate) {
      throw new Error('Failed to update one or both cues');
    }

    return [firstUpdate, secondUpdate];
  } catch (error) {
    console.error('Error in moveCueUp:', error);
    throw error;
  }
}

// Move a cue down by swapping with the next cue
export async function moveCueDown(cue: Cue, nextCue: Cue): Promise<[Cue, Cue]> {
  try {
    console.log('Moving cue down:', { cue, nextCue });
    return moveCueUp(nextCue, cue);
  } catch (error) {
    console.error('Error in moveCueDown:', error);
    throw error;
  }
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
