interface ParsedCueNumber {
  prefix: string;
  number: number;
}

export function parseCueNumber(cueNumber: string): ParsedCueNumber {
  const match = cueNumber.match(/^([A-Z])(\d+)[a-z]?$/);
  if (!match) {
    throw new Error(`Invalid cue number format: ${cueNumber}`);
  }
  return {
    prefix: match[1],
    number: parseInt(match[2], 10)
  };
}

export function formatCueNumber(prefix: string, number: number): string {
  return `${prefix}${number.toString().padStart(3, '0')}`;
}

export function generateCueNumberBetween(prevNumber: string | null, nextNumber: string | null): string {
  if (!prevNumber) {
    return nextNumber ? insertBefore(nextNumber) : 'A101';
  }
  if (!nextNumber) {
    return insertAfter(prevNumber);
  }
  
  // If custom format is detected (like A101b), append 'a' to the previous number
  if (prevNumber.match(/[A-Z]\d+[a-z]?/) && !nextNumber.match(/[A-Z]\d+[a-z]?/)) {
    return prevNumber + 'a';
  }

  // Handle numeric part
  const prevBase = prevNumber.match(/[A-Z]\d+/)?.[0] || prevNumber;
  const nextBase = nextNumber.match(/[A-Z]\d+/)?.[0] || nextNumber;
  
  if (prevBase === nextBase) {
    // If they have the same base, append 'a' to the previous number
    return prevNumber + 'a';
  }

  // Default to numeric interpolation
  const prevNum = parseInt(prevNumber.match(/\d+/)?.[0] || '0');
  const nextNum = parseInt(nextNumber.match(/\d+/)?.[0] || '999');
  
  if (nextNum - prevNum > 1) {
    const middleNum = Math.floor((prevNum + nextNum) / 2);
    return `A${middleNum.toString().padStart(3, '0')}`;
  }
  
  // If numbers are consecutive, append 'a' to the previous number
  return prevNumber + 'a';
}

function insertBefore(num: string): string {
  const match = num.match(/[A-Z](\d+)/);
  if (!match) return 'A101';
  const number = parseInt(match[1]);
  return `A${(number - 1).toString().padStart(3, '0')}`;
}

function insertAfter(num: string): string {
  const match = num.match(/[A-Z](\d+)/);
  if (!match) return 'A101';
  const number = parseInt(match[1]);
  return `A${(number + 1).toString().padStart(3, '0')}`;
}

import { Cue } from '../types/cue';

export function validateCueNumber(cueNumber: string): boolean {
  const pattern = /^[A-Z]\d+[a-z]?$/;
  return pattern.test(cueNumber);
}

export function generateNextCueNumber(cues: Cue[], currentIndex?: number): string {
  if (cues.length === 0) {
    return 'A101';
  }

  if (currentIndex === undefined) {
    // If no index provided, generate next number after the last cue
    const lastCue = cues[cues.length - 1];
    const match = lastCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!match) return 'A101';

    const [, letter, number] = match;
    return `${letter}${String(parseInt(number) + 1).padStart(3, '0')}`;
  }

  // Generate a number between two existing cues
  const prevCue = currentIndex > 0 ? cues[currentIndex - 1] : null;
  const nextCue = currentIndex < cues.length ? cues[currentIndex] : null;

  if (!prevCue) {
    // Inserting at the beginning
    const nextMatch = nextCue?.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!nextMatch) return 'A101';
    
    const [, letter, number] = nextMatch;
    const prevNumber = Math.max(1, parseInt(number) - 1);
    return `${letter}${String(prevNumber).padStart(3, '0')}`;
  }

  if (!nextCue) {
    // Inserting at the end
    const prevMatch = prevCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!prevMatch) return 'A101';

    const [, letter, number] = prevMatch;
    return `${letter}${String(parseInt(number) + 1).padStart(3, '0')}`;
  }

  // Inserting between two cues
  const prevMatch = prevCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
  const nextMatch = nextCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
  
  if (!prevMatch || !nextMatch) return 'A101';

  const [, prevLetter, prevNumber] = prevMatch;
  const [, nextLetter, nextNumber] = nextMatch;

  if (prevLetter !== nextLetter) {
    // If letters are different, use the previous letter and increment number
    return `${prevLetter}${String(parseInt(prevNumber) + 1).padStart(3, '0')}`;
  }

  const prev = parseInt(prevNumber);
  const next = parseInt(nextNumber);
  
  if (next - prev > 1) {
    // If there's space between numbers, use the middle
    const middle = Math.floor((prev + next) / 2);
    return `${prevLetter}${String(middle).padStart(3, '0')}`;
  }

  // If numbers are consecutive, add a letter suffix to the previous number
  return `${prevLetter}${prevNumber}a`;
}

export function getNextAvailableCueNumber(existingCueNumbers: string[]): string {
  if (existingCueNumbers.length === 0) {
    return 'A101';
  }

  const lastCue = existingCueNumbers[existingCueNumbers.length - 1];
  const parsed = parseCueNumber(lastCue);

  // If we're at 999, move to next letter
  if (parsed.number === 999) {
    const nextPrefix = String.fromCharCode(parsed.prefix.charCodeAt(0) + 1);
    return formatCueNumber(nextPrefix, 101);
  }

  return formatCueNumber(parsed.prefix, parsed.number + 1);
}
