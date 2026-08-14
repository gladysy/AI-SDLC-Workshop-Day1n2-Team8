import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNextDueDate } from '../../lib/recurrence';

test('daily pattern increments by one day', () => {
  assert.equal(
    calculateNextDueDate('2025-11-10T14:00:00+08:00', 'daily'),
    '2025-11-11T14:00:00+08:00'
  );
});

test('weekly pattern increments by seven days', () => {
  assert.equal(
    calculateNextDueDate('2025-11-10T14:00:00+08:00', 'weekly'),
    '2025-11-17T14:00:00+08:00'
  );
});

test('monthly pattern clamps month end', () => {
  assert.equal(
    calculateNextDueDate('2025-01-31T09:00:00+08:00', 'monthly'),
    '2025-02-28T09:00:00+08:00'
  );
  assert.equal(
    calculateNextDueDate('2024-01-31T09:00:00+08:00', 'monthly'),
    '2024-02-29T09:00:00+08:00'
  );
});

test('yearly pattern clamps leap day', () => {
  assert.equal(
    calculateNextDueDate('2024-02-29T09:00:00+08:00', 'yearly'),
    '2025-02-28T09:00:00+08:00'
  );
});
