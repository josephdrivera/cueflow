import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, DocumentData, QueryDocumentSnapshot, writeBatch } from 'firebase/firestore';
import { Cue, NewCue } from '@/types/cue';
import { validateCueNumber } from '@/utils/cueNumbering';

const COLLECTION_NAME = 'cues';

// Helper function to convert Firestore document to Cue type
const convertToCue = (doc: QueryDocumentSnapshot<DocumentData>): Cue => {
  const data = doc.data();
  return {
    id: doc.id,
    day_cue_list_id: data.day_cue_list_id,
    show_id: data.show_id,
    cue_number: data.cue_number,
    display_id: data.display_id,
    start_time: data.start_time,
    run_time: data.run_time,
    end_time: data.end_time,
    activity: data.activity,
    graphics: data.graphics,
    video: data.video,
    audio: data.audio,
    lighting: data.lighting,
    notes: data.notes,
    previous_cue_id: data.previous_cue_id,
    next_cue_id: data.next_cue_id,
    created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at.toDate()).toISOString() : undefined
  };
};

// Helper functions
export async function getAllCues(showId: string): Promise<Cue[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('day_cue_list_id', '==', showId),
      orderBy('cue_number')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertToCue);
  } catch (error) {
    console.error('Error in getAllCues:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function getCueById(id: string): Promise<Cue> { 
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Cue not found with id: ${id}`);
  }

  return {
    id: docSnap.id,
    ...docSnap.data() as Omit<Cue, 'id'>
  };
}

export async function createCue(cue: NewCue): Promise<Cue> {
  try {
    // Validate and format the cue number
    const cueNumber = cue.cue_number.toString().replace(/^([A-Z])([0-9]+)([a-z])?$/, (_, prefix, num, suffix) => {
      // Ensure exactly 3 digits
      const paddedNum = num.padStart(3, '0');
      if (paddedNum.length > 3) {
        throw new Error(`Invalid cue number format. Number part must be exactly 3 digits (e.g., A001, B123, C001a)`);
      }
      return `${prefix}${paddedNum}${suffix || ''}`;
    });

    // Validate the final formatted cue number
    if (!validateCueNumber(cueNumber)) {
      throw new Error(`Invalid cue number format: ${cueNumber}. Must be a letter followed by exactly 3 digits, with an optional lowercase letter (e.g., A001, B123, C001a)`);
    }

    // Format the display_id if provided, otherwise use cue_number
    const displayId = cue.display_id ? cue.display_id.toString().replace(/^([A-Z])([0-9]+)([a-z])?$/, (_, prefix, num, suffix) => {
      const paddedNum = num.padStart(3, '0');
      if (paddedNum.length > 3) {
        throw new Error(`Invalid display ID format. Number part must be exactly 3 digits (e.g., A001, B123, C001a)`);
      }
      return `${prefix}${paddedNum}${suffix || ''}`;
    }) : cueNumber;

    // Validate the display_id format
    if (!validateCueNumber(displayId)) {
      throw new Error(`Invalid display ID format: ${displayId}. Must be a letter followed by exactly 3 digits, with an optional lowercase letter (e.g., A001, B123, C001a)`);
    }

    // Prepare the new cue data exactly as per schema
    const newCue = {
      ...cue,
      cue_number: cueNumber,
      display_id: displayId,
      start_time: cue.start_time || '00:00:00',
      run_time: cue.run_time || '00:00:00',
      end_time: cue.end_time || '00:00:00',
      activity: cue.activity ?? '',
      graphics: cue.graphics ?? '',
      video: cue.video ?? '',
      audio: cue.audio ?? '',
      lighting: cue.lighting ?? '',
      notes: cue.notes ?? '',
      previous_cue_id: cue.previous_cue_id ?? null,
      next_cue_id: cue.next_cue_id ?? null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    console.log('Creating new cue:', newCue);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newCue);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('No data returned after creating cue');
    }

    return {
      id: docRef.id,
      ...docSnap.data() as Omit<Cue, 'id'>
    };
  } catch (error) {
    console.error('Error in createCue:', error);
    if (error instanceof Error) {
      throw error;  // Re-throw the error with its original message
    }
    // If it's not an Error instance, wrap it in an Error
    throw new Error(`Failed to create cue: ${String(error)}`);
  }
}

export async function updateCue(id: string, cue: Partial<Cue>): Promise<Cue> {
  try {
    // If updating cue number, validate it first
    if (cue.cue_number && !validateCueNumber(cue.cue_number)) {
      throw new Error(`Invalid cue number format: ${cue.cue_number}`);
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Prepare update data
    const updateData = {
      ...(cue.cue_number && { cue_number: cue.cue_number }),
      ...(cue.start_time && { start_time: cue.start_time }),
      ...(cue.run_time && { run_time: cue.run_time }),
      ...(cue.end_time && { end_time: cue.end_time }),
      ...(cue.activity !== undefined && { activity: cue.activity }),
      ...(cue.graphics !== undefined && { graphics: cue.graphics }),
      ...(cue.video !== undefined && { video: cue.video }),
      ...(cue.audio !== undefined && { audio: cue.audio }),
      ...(cue.lighting !== undefined && { lighting: cue.lighting }),
      ...(cue.notes !== undefined && { notes: cue.notes }),
      ...(cue.day_cue_list_id && { day_cue_list_id: cue.day_cue_list_id }),
      ...(cue.previous_cue_id !== undefined && { previous_cue_id: cue.previous_cue_id }),
      ...(cue.next_cue_id !== undefined && { next_cue_id: cue.next_cue_id }),
      updated_at: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('No data returned from cue update');
    }

    return {
      id: docSnap.id,
      ...docSnap.data() as Omit<Cue, 'id'>
    };
  } catch (error) {
    console.error('Error updating cue:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function deleteCue(id: string): Promise<void> {
  try {
    console.log('Starting to delete cue with ID:', id);

    // First, update any references to this cue to be null
    // Get all cues that reference this cue
    const previousCueQuery = query(
      collection(db, COLLECTION_NAME),
      where('next_cue_id', '==', id)
    );
    
    const nextCueQuery = query(
      collection(db, COLLECTION_NAME),
      where('previous_cue_id', '==', id)
    );

    const [previousCueSnapshot, nextCueSnapshot] = await Promise.all([
      getDocs(previousCueQuery),
      getDocs(nextCueQuery)
    ]);

    // Update references in a batch
    const batch = writeBatch(db);
    
    previousCueSnapshot.forEach(doc => {
      batch.update(doc.ref, { next_cue_id: null });
    });
    
    nextCueSnapshot.forEach(doc => {
      batch.update(doc.ref, { previous_cue_id: null });
    });
    
    // Commit the batch
    await batch.commit();

    // Delete the cue
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log('Successfully deleted cue');
  } catch (error) {
    console.error('Error in deleteCue:', error);
    if (error instanceof Error) {
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
    day_cue_list_id: showId,
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

export async function checkDuplicateCueNumber(day_cue_list_id: string, cueNumber: string, excludeId?: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('day_cue_list_id', '==', day_cue_list_id),
      where('cue_number', '==', cueNumber)
    );
    
    const querySnapshot = await getDocs(q);
    
    // If excludeId is provided, filter out that document
    if (excludeId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking for duplicate cue number:', error);
    throw error;
  }
}

// Move a cue up by swapping with the previous cue
export async function moveCueUp(cue: Cue, previousCue: Cue): Promise<[Cue, Cue]> {
  try {
    const batch = writeBatch(db);
    
    // Get references to both documents
    const cueRef = doc(db, COLLECTION_NAME, cue.id);
    const prevCueRef = doc(db, COLLECTION_NAME, previousCue.id);
    
    // Swap cue numbers
    const tempCueNumber = cue.cue_number;
    const tempDisplayId = cue.display_id;
    
    // Update the current cue
    batch.update(cueRef, {
      cue_number: previousCue.cue_number,
      display_id: previousCue.display_id,
      updated_at: serverTimestamp()
    });
    
    // Update the previous cue
    batch.update(prevCueRef, {
      cue_number: tempCueNumber,
      display_id: tempDisplayId,
      updated_at: serverTimestamp()
    });
    
    // Commit the batch
    await batch.commit();
    
    // Get the updated documents
    const [updatedCueSnap, updatedPrevCueSnap] = await Promise.all([
      getDoc(cueRef),
      getDoc(prevCueRef)
    ]);
    
    if (!updatedCueSnap.exists() || !updatedPrevCueSnap.exists()) {
      throw new Error('Failed to retrieve updated cues after moving');
    }
    
    const updatedCue = {
      id: updatedCueSnap.id,
      ...updatedCueSnap.data() as Omit<Cue, 'id'>
    };
    
    const updatedPrevCue = {
      id: updatedPrevCueSnap.id,
      ...updatedPrevCueSnap.data() as Omit<Cue, 'id'>
    };
    
    return [updatedCue, updatedPrevCue];
  } catch (error) {
    console.error('Error moving cue up:', error);
    throw error;
  }
}

// Move a cue down by swapping with the next cue
export async function moveCueDown(cue: Cue, nextCue: Cue): Promise<[Cue, Cue]> {
  // This is just the inverse of moveCueUp
  return moveCueUp(nextCue, cue);
}

// Helper functions for cue number generation

export function generateCueNumberBefore(number: string): string {
  const prefix = number.charAt(0);
  const numeric = parseInt(number.substring(1));
  if (numeric > 101) {
    return `${prefix}${(numeric - 1).toString()}`;
  }
  // If we can't decrement, we need a new prefix
  const newPrefix = String.fromCharCode(prefix.charCodeAt(0) - 1);
  return `${newPrefix}999`;
}

export function generateCueNumberAfter(number: string): string {
  const prefix = number.charAt(0);
  const numeric = parseInt(number.substring(1));
  if (numeric < 999) {
    return `${prefix}${(numeric + 1).toString()}`;
  }
  // If we can't increment, we need a new prefix
  const newPrefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
  return `${newPrefix}101`;
}

export function generateCueNumberBetween(before: string, after: string): string {
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
