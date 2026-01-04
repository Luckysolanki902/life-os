
export type SubtaskDraft = {
  id: string;
  title: string;
  type: 'checkbox' | 'reps' | 'duration';
  rate: number;
  unit?: string;
};

export function parseSubtasksCSV(csvContent: string): SubtaskDraft[] {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const subtasks: SubtaskDraft[] = [];

  for (const line of lines) {
    // Simple CSV parsing: split by comma
    // Expected format: title, type, rate, unit
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length < 3) continue; // Skip invalid lines

    const title = parts[0];
    const typeRaw = parts[1].toLowerCase();
    const rate = Number(parts[2]);
    const unit = parts[3] || '';

    let type: 'checkbox' | 'reps' | 'duration' = 'reps';
    if (typeRaw === 'checkbox' || typeRaw === 'check') type = 'checkbox';
    else if (typeRaw === 'duration' || typeRaw === 'time') type = 'duration';
    else if (typeRaw === 'reps') type = 'reps';
    else continue; // Invalid type

    if (isNaN(rate)) continue; // Invalid rate

    subtasks.push({
      id: crypto.randomUUID(),
      title,
      type,
      rate,
      unit
    });
  }

  return subtasks;
}
