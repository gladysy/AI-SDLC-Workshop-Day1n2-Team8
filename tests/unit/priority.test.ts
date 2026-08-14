import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePriority, isPriority, PRIORITY_ORDER } from '../../lib/priority';

test('validatePriority accepts the three valid levels', () => {
  assert.equal(validatePriority('high'), 'high');
  assert.equal(validatePriority('medium'), 'medium');
  assert.equal(validatePriority('low'), 'low');
});

test('validatePriority defaults null/undefined to medium', () => {
  assert.equal(validatePriority(undefined), 'medium');
  assert.equal(validatePriority(null), 'medium');
});

test('validatePriority throws on invalid values', () => {
  assert.throws(() => validatePriority('urgent'), /Invalid priority/);
  assert.throws(() => validatePriority('HIGH'), /Invalid priority/);
  assert.throws(() => validatePriority(''), /Invalid priority/);
  assert.throws(() => validatePriority(1), /Invalid priority/);
});

test('isPriority is a correct type guard', () => {
  assert.equal(isPriority('low'), true);
  assert.equal(isPriority('nope'), false);
});

test('PRIORITY_ORDER ranks high before medium before low', () => {
  assert.ok(PRIORITY_ORDER.high < PRIORITY_ORDER.medium);
  assert.ok(PRIORITY_ORDER.medium < PRIORITY_ORDER.low);
});
