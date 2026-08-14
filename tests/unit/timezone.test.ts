import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fromSingaporeInputValue,
  toSingaporeInputValue,
  formatSingaporeDate,
} from '../../lib/timezone';

test('fromSingaporeInputValue appends the Singapore offset', () => {
  assert.equal(fromSingaporeInputValue('2026-08-14T14:00'), '2026-08-14T14:00:00+08:00');
});

test('fromSingaporeInputValue returns null for empty input', () => {
  assert.equal(fromSingaporeInputValue(''), null);
  assert.equal(fromSingaporeInputValue(null), null);
  assert.equal(fromSingaporeInputValue(undefined), null);
});

test('toSingaporeInputValue renders a UTC instant in Singapore local time', () => {
  // 06:00 UTC == 14:00 in Singapore (UTC+8).
  assert.equal(toSingaporeInputValue('2026-08-14T06:00:00Z'), '2026-08-14T14:00');
});

test('input value round-trips through Singapore conversions', () => {
  const local = '2026-12-25T09:30';
  const iso = fromSingaporeInputValue(local);
  assert.ok(iso);
  assert.equal(toSingaporeInputValue(iso), local);
});

test('toSingaporeInputValue and formatSingaporeDate tolerate invalid input', () => {
  assert.equal(toSingaporeInputValue('not-a-date'), '');
  assert.equal(toSingaporeInputValue(null), '');
  assert.equal(formatSingaporeDate('not-a-date'), '');
  assert.equal(formatSingaporeDate(null), '');
});

test('formatSingaporeDate produces a non-empty string for a valid instant', () => {
  const formatted = formatSingaporeDate('2026-08-14T06:00:00Z');
  assert.ok(formatted.length > 0);
});
