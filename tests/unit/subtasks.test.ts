import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateProgress } from '../../lib/subtasks';
import type { Subtask } from '../../lib/db';

function makeSubtask(overrides: Partial<Subtask>): Subtask {
  return {
    id: 1,
    todo_id: 10,
    title: 'item',
    completed: false,
    position: 0,
    created_at: '2026-08-14T00:00:00+08:00',
    ...overrides,
  };
}

test('calculateProgress handles empty array', () => {
  assert.deepEqual(calculateProgress([]), { completed: 0, total: 0, percent: 0 });
});

test('calculateProgress handles partial completion with rounding', () => {
  const subtasks = [
    makeSubtask({ id: 1, completed: true }),
    makeSubtask({ id: 2, completed: true }),
    makeSubtask({ id: 3, completed: false }),
  ];

  assert.deepEqual(calculateProgress(subtasks), {
    completed: 2,
    total: 3,
    percent: 67,
  });
});

test('calculateProgress reaches 100 when all complete', () => {
  const subtasks = [makeSubtask({ completed: true }), makeSubtask({ id: 2, completed: true })];
  assert.deepEqual(calculateProgress(subtasks), {
    completed: 2,
    total: 2,
    percent: 100,
  });
});
