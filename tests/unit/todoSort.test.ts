import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Todo } from '../../lib/db';
import { sortTodos, sectionTodos } from '../../lib/todoSort';

let nextId = 1;
function makeTodo(overrides: Partial<Todo>): Todo {
  return {
    id: nextId++,
    user_id: 1,
    title: 'task',
    completed: false,
    due_date: null,
    priority: 'medium',
    is_recurring: false,
    recurrence_pattern: null,
    reminder_minutes: null,
    last_notification_sent: null,
    created_at: '2026-01-01T00:00:00+08:00',
    updated_at: null,
    ...overrides,
  };
}

const today = '2026-08-14T10:00:00+08:00';
const tomorrow = '2026-08-15T10:00:00+08:00';
const nextWeek = '2026-08-21T10:00:00+08:00';

test('sortTodos orders by priority, then due date, then no-due-date last', () => {
  const highToday = makeTodo({ priority: 'high', due_date: today });
  const highTomorrow = makeTodo({ priority: 'high', due_date: tomorrow });
  const mediumToday = makeTodo({ priority: 'medium', due_date: today });
  const mediumNextWeek = makeTodo({ priority: 'medium', due_date: nextWeek });
  const lowTomorrow = makeTodo({ priority: 'low', due_date: tomorrow });
  const lowNoDue = makeTodo({ priority: 'low', due_date: null });

  const shuffled = [lowNoDue, mediumNextWeek, highTomorrow, lowTomorrow, highToday, mediumToday];
  const sorted = sortTodos(shuffled);

  assert.deepEqual(
    sorted.map((t) => t.id),
    [highToday, highTomorrow, mediumToday, mediumNextWeek, lowTomorrow, lowNoDue].map((t) => t.id)
  );
});

test('sortTodos does not mutate its input array', () => {
  const a = makeTodo({ priority: 'low' });
  const b = makeTodo({ priority: 'high' });
  const input = [a, b];
  const snapshot = [...input];
  const sorted = sortTodos(input);

  assert.notEqual(sorted, input);
  assert.deepEqual(input, snapshot);
});

test('sortTodos breaks ties by newest creation date first', () => {
  const older = makeTodo({ priority: 'high', due_date: today, created_at: '2026-08-01T00:00:00+08:00' });
  const newer = makeTodo({ priority: 'high', due_date: today, created_at: '2026-08-10T00:00:00+08:00' });
  const sorted = sortTodos([older, newer]);
  assert.deepEqual(sorted.map((t) => t.id), [newer.id, older.id]);
});

test('sectionTodos buckets todos at the due-date boundary', () => {
  const now = new Date('2026-08-14T12:00:00+08:00');
  const dueExactlyNow = makeTodo({ due_date: '2026-08-14T12:00:00+08:00' });
  const dueJustBefore = makeTodo({ due_date: '2026-08-14T11:59:59+08:00' });
  const noDue = makeTodo({ due_date: null });
  const completedPast = makeTodo({ completed: true, due_date: '2026-01-01T00:00:00+08:00' });

  const { overdue, pending, completed } = sectionTodos(
    [dueExactlyNow, dueJustBefore, noDue, completedPast],
    now
  );

  assert.deepEqual(overdue.map((t) => t.id), [dueJustBefore.id]);
  assert.ok(pending.some((t) => t.id === dueExactlyNow.id));
  assert.ok(pending.some((t) => t.id === noDue.id));
  assert.deepEqual(completed.map((t) => t.id), [completedPast.id]);
});
