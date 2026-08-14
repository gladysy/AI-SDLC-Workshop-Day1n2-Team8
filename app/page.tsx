'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Todo } from '@/lib/db';
import {
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  PRIORITY_VALUES,
  type Priority,
} from '@/lib/priority';
import { sectionTodos, sortTodos, type TodoSections } from '@/lib/todoSort';
import {
  formatSingaporeDate,
  fromSingaporeInputValue,
  getSingaporeNow,
  toSingaporeInputValue,
} from '@/lib/timezone';

type PriorityFilter = Priority | 'all';

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function PrioritySelect({
  value,
  onChange,
  id,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    >
      {PRIORITY_VALUES.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}

function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={(e) => onToggle(todo, e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 dark:border-gray-600"
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`truncate font-medium ${
                todo.completed
                  ? 'text-gray-400 line-through dark:text-gray-500'
                  : 'text-gray-800 dark:text-white'
              }`}
            >
              {todo.title}
            </p>
            <PriorityBadge priority={todo.priority} />
          </div>
          {todo.due_date && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Due {formatSingaporeDate(todo.due_date)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-3 text-sm">
        <button
          onClick={() => onEdit(todo)}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo)}
          className="text-red-600 hover:underline dark:text-red-400"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function Section({
  title,
  accent,
  todos,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string;
  accent: string;
  todos: Todo[];
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}) {
  if (todos.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className={`mb-2 text-sm font-semibold uppercase tracking-wide ${accent}`}>
        {title} ({todos.length})
      </h2>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueLocal, setDueLocal] = useState('');

  // Filter
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  // Edit modal
  const [editing, setEditing] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueLocal, setEditDueLocal] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/todos');
        if (!res.ok) throw new Error('Failed to load todos');
        const data: Todo[] = await res.json();
        if (active) setTodos(data);
      } catch {
        if (active) setError('Could not load todos.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visibleTodos = useMemo(
    () =>
      priorityFilter === 'all'
        ? todos
        : todos.filter((t) => t.priority === priorityFilter),
    [todos, priorityFilter]
  );

  const sections: TodoSections = useMemo(
    () => sectionTodos(visibleTodos, getSingaporeNow()),
    [visibleTodos]
  );

  const resetForm = () => {
    setTitle('');
    setPriority('medium');
    setDueLocal('');
  };

  const handleAdd = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = title.trim();
      if (!trimmed) {
        setError('Title is required.');
        return;
      }

      let due_date: string | null = null;
      if (dueLocal) {
        due_date = fromSingaporeInputValue(dueLocal);
        const minDue = new Date(getSingaporeNow().getTime() + 60_000);
        if (!due_date || new Date(due_date) < minDue) {
          setError('Due date must be at least 1 minute in the future.');
          return;
        }
      }

      const optimistic: Todo = {
        id: -Date.now(),
        user_id: 0,
        title: trimmed,
        completed: false,
        due_date,
        priority,
        is_recurring: false,
        recurrence_pattern: null,
        reminder_minutes: null,
        last_notification_sent: null,
        created_at: new Date().toISOString(),
        updated_at: null,
      };

      setTodos((prev) => [...prev, optimistic]);
      resetForm();

      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmed, priority, due_date }),
        });
        if (!res.ok) throw new Error('create failed');
        const saved: Todo = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === optimistic.id ? saved : t)));
      } catch {
        setTodos((prev) => prev.filter((t) => t.id !== optimistic.id));
        setError('Could not create todo. Please try again.');
      }
    },
    [title, priority, dueLocal]
  );

  const handleToggle = useCallback(async (todo: Todo, completed: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed } : t)));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('toggle failed');
      const saved: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? saved : t)));
    } catch {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: !completed } : t))
      );
      setError('Could not update todo.');
    }
  }, []);

  const handleDelete = useCallback(async (todo: Todo) => {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    } catch {
      setTodos((prev) => sortTodos([...prev, todo]));
      setError('Could not delete todo.');
    }
  }, []);

  const openEdit = useCallback((todo: Todo) => {
    setEditing(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueLocal(toSingaporeInputValue(todo.due_date));
    setError(null);
  }, []);

  const closeEdit = useCallback(() => setEditing(null), []);

  const handleUpdate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!editing) return;

      const trimmed = editTitle.trim();
      if (!trimmed) {
        setError('Title cannot be empty.');
        return;
      }

      const due_date = editDueLocal ? fromSingaporeInputValue(editDueLocal) : null;
      const patch = { title: trimmed, priority: editPriority, due_date };
      const target = editing;

      setTodos((prev) => prev.map((t) => (t.id === target.id ? { ...t, ...patch } : t)));
      closeEdit();

      try {
        const res = await fetch(`/api/todos/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('update failed');
        const saved: Todo = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === target.id ? saved : t)));
      } catch {
        setError('Could not update todo.');
      }
    },
    [editing, editTitle, editPriority, editDueLocal, closeEdit]
  );

  // Close the edit modal on Escape.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEdit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, closeEdit]);

  const isEmpty =
    !loading &&
    sections.overdue.length === 0 &&
    sections.pending.length === 0 &&
    sections.completed.length === 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Todo App</h1>

      <form
        onSubmit={handleAdd}
        className="mb-6 space-y-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          aria-label="Todo title"
        />
        <div className="flex flex-wrap items-center gap-3">
          <PrioritySelect value={priority} onChange={setPriority} />
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Due date"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="priority-filter" className="text-sm text-gray-600 dark:text-gray-400">
          Filter:
        </label>
        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : isEmpty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No todos yet. Add one above to get started.
        </p>
      ) : (
        <>
          <Section
            title="Overdue"
            accent="text-red-600 dark:text-red-400"
            todos={sections.overdue}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <Section
            title="Pending"
            accent="text-gray-600 dark:text-gray-400"
            todos={sections.pending}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <Section
            title="Completed"
            accent="text-green-600 dark:text-green-400"
            todos={sections.completed}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeEdit}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit todo"
          >
            <h2 className="mb-4 text-lg font-semibold">Edit Todo</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                aria-label="Todo title"
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-3">
                <PrioritySelect value={editPriority} onChange={setEditPriority} />
                <input
                  type="datetime-local"
                  value={editDueLocal}
                  onChange={(e) => setEditDueLocal(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  aria-label="Due date"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitle.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
