import type { Subtask } from './db';

export interface SubtaskProgress {
  completed: number;
  total: number;
  percent: number;
}

export function calculateProgress(subtasks: Subtask[]): SubtaskProgress {
  const total = subtasks.length;
  const completed = subtasks.filter((subtask) => subtask.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}