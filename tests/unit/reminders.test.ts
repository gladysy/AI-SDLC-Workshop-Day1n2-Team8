import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REMINDER_LABELS,
  validateReminderMinutes,
  isReminderMinutes,
} from '../../lib/reminders';

test('reminder labels expose expected abbreviations', () => {
  assert.equal(REMINDER_LABELS[15], '15m');
  assert.equal(REMINDER_LABELS[60], '1h');
  assert.equal(REMINDER_LABELS[10080], '1w');
});

test('reminder validation accepts valid values and null states', () => {
  assert.equal(validateReminderMinutes(30), 30);
  assert.equal(validateReminderMinutes('120'), 120);
  assert.equal(validateReminderMinutes(null), null);
  assert.equal(validateReminderMinutes(undefined), null);
  assert.equal(validateReminderMinutes(''), null);
});

test('reminder validation rejects invalid values', () => {
  assert.throws(() => validateReminderMinutes(20), /Invalid reminder value/);
  assert.throws(() => validateReminderMinutes('abc'), /Invalid reminder value/);
  assert.equal(isReminderMinutes(1440), true);
  assert.equal(isReminderMinutes(999), false);
});
