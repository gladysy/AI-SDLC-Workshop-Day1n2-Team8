import { test } from 'node:test';
import assert from 'node:assert';
import {
  applyFilters,
  hasActiveFilters,
  DEFAULT_FILTER_STATE,
} from '../../lib/filters';
import type { Todo, Tag } from '../../lib/db';

function makeTodo(overrides: Partial<Todo>): Todo {
  return {
    id: 1,
    user_id: 1,
    title: 'Test',
    completed: false,
    due_date: '2026-08-15T10:00:00Z',
    priority: 'medium',
    is_recurring: false,
    recurrence_pattern: null,
    reminder_minutes: null,
    last_notification_sent: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: null,
    tags: [],
    subtasks: [],
    ...overrides,
  };
}

// hasActiveFilters
test('hasActiveFilters returns false for DEFAULT_FILTER_STATE', () => {
  assert.equal(hasActiveFilters(DEFAULT_FILTER_STATE), false);
});

test('hasActiveFilters returns true when search is set', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, search: 'meeting' }), true);
});

test('hasActiveFilters returns true when priority is not all', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, priority: 'high' }), true);
});

test('hasActiveFilters returns true when tagId is not all', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, tagId: 5 }), true);
});

test('hasActiveFilters returns true when completion is not all', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, completion: 'completed' }), true);
});

test('hasActiveFilters returns true when dueDateFrom is set', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, dueDateFrom: '2026-01-01' }), true);
});

test('hasActiveFilters treats whitespace-only search as inactive', () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTER_STATE, search: '   ' }), false);
});

// applyFilters - search
test('applyFilters: search matches todo title case-insensitively', () => {
  const todos = [makeTodo({ title: 'Team Meeting' }), makeTodo({ title: 'Buy groceries' })];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, search: 'meeting' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Team Meeting');
});

test('applyFilters: search matches subtask title', () => {
  const todos = [
    makeTodo({ title: 'Plan project', subtasks: [{ id: 1, todo_id: 1, title: 'Schedule meeting', completed: false, position: 0, created_at: '' }] }),
    makeTodo({ title: 'Buy groceries', subtasks: [] }),
  ];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, search: 'meeting' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Plan project');
});

test('applyFilters: empty search returns all todos', () => {
  const todos = [makeTodo({ title: 'A' }), makeTodo({ title: 'B' })];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, search: '' });
  assert.equal(result.length, 2);
});

// applyFilters - priority
test('applyFilters: priority filter shows only matching priority', () => {
  const todos = [
    makeTodo({ priority: 'high' }),
    makeTodo({ priority: 'medium' }),
    makeTodo({ priority: 'low' }),
  ];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, priority: 'high' });
  assert.equal(result.length, 1);
  assert.equal(result[0].priority, 'high');
});

// applyFilters - tag
test('applyFilters: tag filter shows only todos with that tag', () => {
  const workTag: Tag = { id: 1, user_id: 1, name: 'Work', color: '#3B82F6', created_at: '' };
  const todos = [
    makeTodo({ tags: [workTag] }),
    makeTodo({ tags: [] }),
  ];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, tagId: 1 });
  assert.equal(result.length, 1);
  assert.ok(result[0].tags?.some((t) => t.id === 1));
});

// applyFilters - completion
test('applyFilters: completion=incomplete filters out completed todos', () => {
  const todos = [
    makeTodo({ completed: false }),
    makeTodo({ completed: true }),
  ];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, completion: 'incomplete' });
  assert.equal(result.length, 1);
  assert.equal(result[0].completed, false);
});

test('applyFilters: completion=completed filters out incomplete todos', () => {
  const todos = [
    makeTodo({ completed: false }),
    makeTodo({ completed: true }),
  ];
  const result = applyFilters(todos, { ...DEFAULT_FILTER_STATE, completion: 'completed' });
  assert.equal(result.length, 1);
  assert.equal(result[0].completed, true);
});

// applyFilters - date range
test('applyFilters: date range only matches todos WITH due_date', () => {
  const todos = [
    makeTodo({ due_date: '2026-08-15T10:00:00Z' }),
    makeTodo({ due_date: null }),
  ];
  const result = applyFilters(todos, {
    ...DEFAULT_FILTER_STATE,
    dueDateFrom: '2026-08-01',
    dueDateTo: '2026-08-31',
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].due_date);
});

test('applyFilters: date range with both from and to', () => {
  const todos = [
    makeTodo({ due_date: '2026-08-10T10:00:00Z' }),
    makeTodo({ due_date: '2026-08-20T10:00:00Z' }),
    makeTodo({ due_date: '2026-09-01T10:00:00Z' }),
  ];
  const result = applyFilters(todos, {
    ...DEFAULT_FILTER_STATE,
    dueDateFrom: '2026-08-15',
    dueDateTo: '2026-08-25',
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].due_date?.includes('2026-08-20'));
});

test('applyFilters: from > to yields empty results', () => {
  const todos = [makeTodo({ due_date: '2026-08-15T10:00:00Z' })];
  const result = applyFilters(todos, {
    ...DEFAULT_FILTER_STATE,
    dueDateFrom: '2026-09-01',
    dueDateTo: '2026-08-01',
  });
  assert.equal(result.length, 0);
});

// applyFilters - combined AND logic
test('applyFilters: combined filters apply as AND intersection', () => {
  const workTag: Tag = { id: 1, user_id: 1, name: 'Work', color: '#3B82F6', created_at: '' };
  const todos = [
    makeTodo({ title: 'Urgent Meeting', priority: 'high', completed: false, tags: [workTag], due_date: '2026-08-15T10:00:00Z' }),
    makeTodo({ title: 'Low Priority Work', priority: 'low', completed: false, tags: [workTag], due_date: '2026-08-15T10:00:00Z' }),
    makeTodo({ title: 'High Priority Personal', priority: 'high', completed: false, tags: [], due_date: '2026-08-15T10:00:00Z' }),
    makeTodo({ title: 'Completed Work', priority: 'high', completed: true, tags: [workTag], due_date: '2026-08-15T10:00:00Z' }),
  ];
  const result = applyFilters(todos, {
    ...DEFAULT_FILTER_STATE,
    priority: 'high',
    tagId: 1,
    completion: 'incomplete',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Urgent Meeting');
});

test('applyFilters: order search -> priority -> tag -> completion -> date', () => {
  const todos = [
    makeTodo({ title: 'Meeting', priority: 'high', completed: false, tags: [], due_date: '2026-08-15T10:00:00Z' }),
    makeTodo({ title: 'Meeting', priority: 'low', completed: false, tags: [], due_date: '2026-08-15T10:00:00Z' }),
  ];
  const result = applyFilters(todos, {
    ...DEFAULT_FILTER_STATE,
    search: 'meeting',
    priority: 'high',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].priority, 'high');
});
