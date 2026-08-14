// Pure sorting/sectioning logic for todos. Safe to import on client and server.
// `import type` for Todo is erased at build time, so this never pulls in the DB.

import type { Todo } from './db';
import { PRIORITY_ORDER } from './priority';

// Orders todos by priority (High -> Medium -> Low), then earliest due date
// (todos with no due date sort last), then newest creation date as a tiebreaker.
export function compareTodos(a: Todo, b: Todo): number {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  if (a.due_date && b.due_date) {
    const dueDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (dueDiff !== 0) return dueDiff;
  } else if (a.due_date && !b.due_date) {
    return -1;
  } else if (!a.due_date && b.due_date) {
    return 1;
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// Returns a new sorted array; never mutates the input.
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort(compareTodos);
}

export interface TodoSections {
  overdue: Todo[];
  pending: Todo[];
  completed: Todo[];
}

// Buckets todos into Overdue / Pending / Completed relative to `now`.
// A todo is overdue only if it is incomplete and its due date is strictly in the past.
export function sectionTodos(todos: Todo[], now: Date): TodoSections {
  const nowMs = now.getTime();
  const incomplete = todos.filter((t) => !t.completed);

  const overdue = sortTodos(
    incomplete.filter((t) => t.due_date !== null && new Date(t.due_date).getTime() < nowMs)
  );
  const pending = sortTodos(
    incomplete.filter((t) => t.due_date === null || new Date(t.due_date).getTime() >= nowMs)
  );
  const completed = todos
    .filter((t) => t.completed)
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime()
    );

  return { overdue, pending, completed };
}
