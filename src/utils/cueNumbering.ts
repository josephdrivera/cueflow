interface ParsedCueNumber {
  prefix: string;
  number: number;
}

export function parseCueNumber(cueNumber: string): ParsedCueNumber {
  const match = cueNumber.match(/^([A-Z])(\d+)$/);
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

export function generateCueNumberBetween(
  prevCueNumber: string | null, 
  nextCueNumber: string | null
): string {
  // Case 1: No previous cue - start with A101
  if (!prevCueNumber) {
    return 'A101';
  }

  // Case 2: No next cue - increment the last cue number
  if (!nextCueNumber) {
    const parsed = parseCueNumber(prevCueNumber);
    return formatCueNumber(parsed.prefix, parsed.number + 1);
  }

  // Case 3: Inserting between two cues
  const prev = parseCueNumber(prevCueNumber);
  const next = parseCueNumber(nextCueNumber);

  // If prefixes are different, use the previous prefix and increment
  if (prev.prefix !== next.prefix) {
    return formatCueNumber(prev.prefix, prev.number + 1);
  }

  // If numbers are consecutive, need to handle special cases
  if (next.number - prev.number === 1) {
    // If we're at 999, move to next letter
    if (prev.number === 999) {
      const nextPrefix = String.fromCharCode(prev.prefix.charCodeAt(0) + 1);
      return formatCueNumber(nextPrefix, 101);
    }
    
    // If we're at x99, need to handle the transition to x100
    if (prev.number % 100 === 99) {
      // Create a number between x99 and x100 by adding decimal places
      // and rounding to the nearest integer
      const newNumber = Math.floor((prev.number + next.number) / 2);
      return formatCueNumber(prev.prefix, newNumber);
    }
  }

  // Normal case: average the numbers and round down
  const newNumber = Math.floor((prev.number + next.number) / 2);
  return formatCueNumber(prev.prefix, newNumber);
}

export function validateCueNumber(
  cueNumber: string, 
  existingCueNumbers: string[]
): boolean {
  try {
    // Check format
    const parsed = parseCueNumber(cueNumber);
    
    // Check if number is in valid range (101-999)
    if (parsed.number < 101 || parsed.number > 999) {
      return false;
    }

    // Check for duplicates
    if (existingCueNumbers.includes(cueNumber)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
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
