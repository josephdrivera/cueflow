export interface ParsedCueNumber {
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
  // Default case for empty list or first item
  if (!prevNumber) {
    return nextNumber ? insertBefore(nextNumber) : 'A001';
  }
  if (!nextNumber) {
    return insertAfter(prevNumber);
  }

  // Parse the numbers
  const prevMatch = prevNumber.match(/^([A-Z])(\d+)([a-z])?$/);
  const nextMatch = nextNumber.match(/^([A-Z])(\d+)([a-z])?$/);
  
  if (!prevMatch || !nextMatch) {
    throw new Error(`Invalid cue number format: ${!prevMatch ? prevNumber : nextNumber}`);
  }

  const [, prevLetter, prevNum, prevSuffix] = prevMatch;
  const [, nextLetter, nextNum] = nextMatch;
  
  const prevNumInt = parseInt(prevNum);
  const nextNumInt = parseInt(nextNum);

  // If numbers are the same, handle suffixes
  if (prevNumInt === nextNumInt) {
    if (!prevSuffix) {
      return `${prevLetter}${prevNum.padStart(3, '0')}a`;
    }
    const nextSuffixChar = String.fromCharCode(prevSuffix.charCodeAt(0) + 1);
    if (nextSuffixChar <= 'z') {
      return `${prevLetter}${prevNum.padStart(3, '0')}${nextSuffixChar}`;
    }
  }

  // If numbers are consecutive
  if (nextNumInt - prevNumInt === 1) {
    return `${prevLetter}${prevNum.padStart(3, '0')}a`;
  }

  // If there's space between numbers
  const middleNum = Math.floor((prevNumInt + nextNumInt) / 2);
  return formatCueNumber(prevLetter, middleNum);
}

function insertBefore(num: string): string {
  const match = num.match(/[A-Z](\d+)/);
  if (!match) return 'A001';
  const number = parseInt(match[1]);
  return `A${(number - 1).toString().padStart(3, '0')}`;
}

function insertAfter(num: string): string {
  const match = num.match(/[A-Z](\d+)/);
  if (!match) return 'A001';
  const number = parseInt(match[1]);
  return `A${(number + 1).toString().padStart(3, '0')}`;
}

import { Cue } from '../types/cue';

export function validateCueNumber(cueNumber: string): boolean {
  const pattern = /^[A-Z][0-9]{3}[a-z]?$/;
  return pattern.test(cueNumber);
}

export function generateNextCueNumber(cues: Cue[], currentIndex?: number): string {
  if (cues.length === 0) {
    return 'A001';
  }

  if (currentIndex === undefined) {
    // If no index provided, generate next number after the last cue
    const lastCue = cues[cues.length - 1];
    const match = lastCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!match) return 'A001';

    const [, letter, number] = match;
    return formatCueNumber(letter, parseInt(number) + 1);
  }

  // Generate a number between two existing cues
  const prevCue = currentIndex > 0 ? cues[currentIndex - 1] : null;
  const nextCue = currentIndex < cues.length ? cues[currentIndex] : null;

  if (!prevCue) {
    // Inserting at the beginning
    const nextMatch = nextCue?.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!nextMatch) return 'A001';
    
    const [, letter, number] = nextMatch;
    const prevNumber = Math.max(1, parseInt(number) - 1);
    return formatCueNumber(letter, prevNumber);
  }

  if (!nextCue) {
    // Inserting at the end
    const prevMatch = prevCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
    if (!prevMatch) return 'A001';

    const [, letter, number] = prevMatch;
    return formatCueNumber(letter, parseInt(number) + 1);
  }

  // Inserting between two cues
  const prevMatch = prevCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
  const nextMatch = nextCue.cue_number.match(/^([A-Z])(\d+)([a-z])?$/);
  
  if (!prevMatch || !nextMatch) return 'A001';

  const [, prevLetter, prevNumber, prevSuffix] = prevMatch;
  const [, nextLetter, nextNumber] = nextMatch;
  
  const prevNumInt = parseInt(prevNumber);
  const nextNumInt = parseInt(nextNumber);

  // If numbers are the same, handle suffixes
  if (prevNumInt === nextNumInt) {
    if (!prevSuffix) {
      return `${prevLetter}${prevNumber.padStart(3, '0')}a`;
    }
    const nextSuffixChar = String.fromCharCode(prevSuffix.charCodeAt(0) + 1);
    if (nextSuffixChar <= 'z') {
      return `${prevLetter}${prevNumber.padStart(3, '0')}${nextSuffixChar}`;
    }
  }

  if (prevLetter !== nextLetter) {
    // If letters are different, use the previous letter and increment number
    return formatCueNumber(prevLetter, prevNumInt + 1);
  }

  const prev = parseInt(prevNumber);
  const next = parseInt(nextNumber);
  
  if (next - prev > 1) {
    // If there's space between numbers, use the middle
    const middle = Math.floor((prev + next) / 2);
    return formatCueNumber(prevLetter, middle);
  }

  // If numbers are consecutive, add a letter suffix to the previous number
  return `${prevLetter}${prevNumber.padStart(3, '0')}a`;
}

export function getNextAvailableCueNumber(existingCueNumbers: string[]): string {
  if (existingCueNumbers.length === 0) {
    return 'A001';
  }

  const lastCue = existingCueNumbers[existingCueNumbers.length - 1];
  const parsed = parseCueNumber(lastCue);

  // If we're at 999, move to next letter
  if (parsed.number === 999) {
    const nextPrefix = String.fromCharCode(parsed.prefix.charCodeAt(0) + 1);
    return formatCueNumber(nextPrefix, 1);
  }

  return formatCueNumber(parsed.prefix, parsed.number + 1);
}

export function ensureUniqueCueNumber(baseNumber: string, existingNumbers: string[]): string {
  if (!existingNumbers.includes(baseNumber)) {
    return baseNumber;
  }

  // If the base number already exists, try adding suffixes
  const match = baseNumber.match(/^([A-Z]\d+)([a-z])?$/);
  if (!match) {
    throw new Error(`Invalid cue number format: ${baseNumber}`);
  }

  const [, base, suffix] = match;
  const nextSuffix = suffix ? String.fromCharCode(suffix.charCodeAt(0) + 1) : 'a';
  const candidateNumber = `${base}${nextSuffix}`;
  
  if (nextSuffix > 'z') {
    // If we've exhausted suffixes, increment the number
    const numMatch = base.match(/^([A-Z])(\d+)$/);
    if (!numMatch) {
      throw new Error(`Invalid base number format: ${base}`);
    }
    const [, letter, num] = numMatch;
    const nextNum = parseInt(num) + 1;
    return ensureUniqueCueNumber(`${letter}${nextNum.toString().padStart(3, '0')}`, existingNumbers);
  }

  return ensureUniqueCueNumber(candidateNumber, existingNumbers);
}
