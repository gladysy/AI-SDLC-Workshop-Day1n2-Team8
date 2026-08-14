'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RecurrencePattern, Subtask, Todo, Template } from '@/lib/db';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { SaveTemplateModal } from '@/lib/components/SaveTemplateModal';
import { TemplateManager } from '@/lib/components/TemplateManager';
import { ExportImportToolbar } from '@/lib/components/ExportImportToolbar';
import { UseTemplateDropdown } from '@/lib/components/UseTemplateDropdown';
import {
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  PRIORITY_VALUES,
  type Priority,
} from '@/lib/priority';
import { isRecurrencePattern } from '@/lib/recurrence';
import {
  REMINDER_LABELS,
  REMINDER_VALUES,
  type ReminderMinutes,
} from '@/lib/reminders';
import { calculateProgress } from '@/lib/subtasks';
import { sectionTodos, sortTodos, type TodoSections } from '@/lib/todoSort';
import {
  formatSingaporeDate,
  fromSingaporeInputValue,
  getSingaporeNow,
  toSingaporeInputValue,
} from '@/lib/timezone';

type PriorityFilter = Priority | 'all';
type TodoUpdatePayload = { todo: Todo | null; nextInstance?: Todo };

const RECURRENCE_OPTIONS: RecurrencePattern[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function RecurrenceBadge({ pattern }: { pattern: RecurrencePattern }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
      {'\u{1F501}'} {pattern}
    </span>
  );
}

function ReminderBadge({ minutes }: { minutes: ReminderMinutes }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:border-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
      {'\u{1F514}'} {REMINDER_LABELS[minutes]}
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

function NotificationToggle() {
  const { permission, requestPermission } = useNotifications();
  const enabled = permission === 'granted';

  return (
    <button
      onClick={requestPermission}
      disabled={enabled}
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        enabled
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
          : 'bg-orange-500 text-white hover:bg-orange-600'
      }`}
      type="button"
    >
      {enabled ? '\u{1F514} Notifications On' : '\u{1F514} Enable Notifications'}
    </button>
  );
}

function ProgressBar({ subtasks }: { subtasks: Subtask[] }) {
  const { completed, total, percent } = calculateProgress(subtasks);
  if (total === 0) return null;

  const barColor = percent === 100 ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {completed}/{total} subtasks
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-full ${barColor} transition-all duration-200`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SubtaskPanel({
  todo,
  onAdd,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onAdd: (todoId: number, title: string) => Promise<void>;
  onToggle: (todoId: number, subtask: Subtask) => Promise<void>;
  onDelete: (todoId: number, subtaskId: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const subtasks = todo.subtasks ?? [];

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await onAdd(todo.id, title);
    setNewTitle('');
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((value) => !value)}
        className="text-sm text-gray-500 dark:text-gray-400"
        type="button"
      >
        {expanded ? '\u25BC' : '\u25B6'} Subtasks
      </button>

      <ProgressBar subtasks={subtasks} />

      {expanded && (
        <div className="mt-2 space-y-2 pl-4">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => {
                  void onToggle(todo.id, subtask);
                }}
              />
              <span className={subtask.completed ? 'text-gray-400 line-through' : ''}>{subtask.title}</span>
              <button
                onClick={() => {
                  void onDelete(todo.id, subtask.id);
                }}
                className="ml-auto text-sm text-red-600 hover:underline dark:text-red-400"
                type="button"
              >
                {'\u2715'}
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
              placeholder="Add subtask..."
              className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => {
                void handleAdd();
              }}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              type="button"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  todo: Todo;
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onAddSubtask: (todoId: number, title: string) => Promise<void>;
  onToggleSubtask: (todoId: number, subtask: Subtask) => Promise<void>;
  onDeleteSubtask: (todoId: number, subtaskId: number) => Promise<void>;
}) {
  return (
    <li className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) => onToggle(todo, e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 dark:border-gray-600"
            aria-label={`Mark \"${todo.title}\" as ${todo.completed ? 'incomplete' : 'complete'}`}
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
              {todo.is_recurring && todo.recurrence_pattern && (
                <RecurrenceBadge pattern={todo.recurrence_pattern} />
              )}
              {todo.reminder_minutes !== null && (
                <ReminderBadge minutes={todo.reminder_minutes as ReminderMinutes} />
              )}
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
            type="button"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo)}
            className="text-red-600 hover:underline dark:text-red-400"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <SubtaskPanel
        todo={todo}
        onAdd={onAddSubtask}
        onToggle={onToggleSubtask}
        onDelete={onDeleteSubtask}
      />
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
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  title: string;
  accent: string;
  todos: Todo[];
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onAddSubtask: (todoId: number, title: string) => Promise<void>;
  onToggleSubtask: (todoId: number, subtask: Subtask) => Promise<void>;
  onDeleteSubtask: (todoId: number, subtaskId: number) => Promise<void>;
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
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueLocal, setDueLocal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const [editing, setEditing] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueLocal, setEditDueLocal] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [editReminderMinutes, setEditReminderMinutes] = useState<ReminderMinutes | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [router]);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to load todos');
      const data: Todo[] = await res.json();
      setTodos(data);
      setError(null);
    } catch {
      setError('Could not load todos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const visibleTodos = useMemo(
    () =>
      priorityFilter === 'all'
        ? todos
        : todos.filter((todo) => todo.priority === priorityFilter),
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
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setReminderMinutes(null);
  };

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ title: string; completed?: boolean }>>([]);

  const normalizeTodo = (todo: Todo): Todo => ({
    ...todo,
    subtasks: todo.subtasks ?? [],
  });

  const handleAdd = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = title.trim();
      if (!trimmed) {
        setError('Title is required.');
        return;
      }

      let dueDate: string | null = null;
      if (dueLocal) {
        dueDate = fromSingaporeInputValue(dueLocal);
        const minDue = new Date(getSingaporeNow().getTime() + 60_000);
        if (!dueDate || new Date(dueDate) < minDue) {
          setError('Due date must be at least 1 minute in the future.');
          return;
        }
      }

      if (isRecurring && !dueDate) {
        setError('Recurring todos require a due date.');
        return;
      }

      if (reminderMinutes !== null && !dueDate) {
        setError('Reminders require a due date.');
        return;
      }

      const optimistic: Todo = {
        id: -Date.now(),
        user_id: 0,
        title: trimmed,
        completed: false,
        due_date: dueDate,
        priority,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        reminder_minutes: reminderMinutes,
        last_notification_sent: null,
        created_at: getSingaporeNow().toISOString(),
        updated_at: null,
        subtasks: [],
      };

      setTodos((prev) => [...prev, optimistic]);
      resetForm();

      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: trimmed,
            priority,
            due_date: dueDate,
            is_recurring: isRecurring,
            recurrence_pattern: isRecurring ? recurrencePattern : null,
            reminder_minutes: reminderMinutes,
          }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? 'create failed');
        }
        const saved = normalizeTodo((await res.json()) as Todo);
        setTodos((prev) => prev.map((todo) => (todo.id === optimistic.id ? saved : todo)));
      } catch (err) {
        setTodos((prev) => prev.filter((todo) => todo.id !== optimistic.id));
        setError((err as Error).message || 'Could not create todo. Please try again.');
      }
    },
    [title, priority, dueLocal, isRecurring, recurrencePattern, reminderMinutes]
  );

  const applyUpdatePayload = (targetId: number, payload: TodoUpdatePayload) => {
    setTodos((prev) => {
      const base = prev.map((todo) =>
        todo.id === targetId && payload.todo ? normalizeTodo(payload.todo) : todo
      );
      if (!payload.nextInstance) {
        return base;
      }
      return sortTodos([...base, normalizeTodo(payload.nextInstance)]);
    });
  };

  const handleToggle = useCallback(async (todo: Todo, completed: boolean) => {
    setTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, completed } : item)));

    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) {
        throw new Error('Could not update todo.');
      }

      const payload = (await res.json()) as TodoUpdatePayload;
      applyUpdatePayload(todo.id, payload);
    } catch {
      setTodos((prev) =>
        prev.map((item) =>
          item.id === todo.id ? { ...item, completed: !completed } : item
        )
      );
      setError('Could not update todo.');
    }
  }, []);

  const handleDelete = useCallback(async (todo: Todo) => {
    setTodos((prev) => prev.filter((item) => item.id !== todo.id));
    try {
      const res = await fetch(`/api/todos/${todo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    } catch {
      setTodos((prev) => sortTodos([...prev, todo]));
      setError('Could not delete todo.');
    }
  }, []);

  const handleAddSubtask = useCallback(async (todoId: number, titleValue: string) => {
    const trimmed = titleValue.trim();
    if (!trimmed) return;

    const optimisticSubtask: Subtask = {
      id: -Date.now(),
      todo_id: todoId,
      title: trimmed,
      completed: false,
      position: (todos.find((todo) => todo.id === todoId)?.subtasks?.length ?? 0) + 1,
      created_at: getSingaporeNow().toISOString(),
    };

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, subtasks: [...(todo.subtasks ?? []), optimisticSubtask] }
          : todo
      )
    );

    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!response.ok) {
        throw new Error('Could not add subtask.');
      }

      const saved = (await response.json()) as Subtask;
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks ?? []).map((subtask) =>
                  subtask.id === optimisticSubtask.id ? saved : subtask
                ),
              }
            : todo
        )
      );
    } catch {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks ?? []).filter(
                  (subtask) => subtask.id !== optimisticSubtask.id
                ),
              }
            : todo
        )
      );
      setError('Could not add subtask.');
    }
  }, [todos]);

  const handleToggleSubtask = useCallback(async (todoId: number, subtask: Subtask) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: (todo.subtasks ?? []).map((item) =>
                item.id === subtask.id ? { ...item, completed: !item.completed } : item
              ),
            }
          : todo
      )
    );

    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      });

      if (!response.ok) {
        throw new Error('Could not update subtask.');
      }

      const saved = (await response.json()) as Subtask;
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks ?? []).map((item) =>
                  item.id === subtask.id ? saved : item
                ),
              }
            : todo
        )
      );
    } catch {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks ?? []).map((item) =>
                  item.id === subtask.id ? { ...item, completed: subtask.completed } : item
                ),
              }
            : todo
        )
      );
      setError('Could not update subtask.');
    }
  }, []);

  const handleDeleteSubtask = useCallback(async (todoId: number, subtaskId: number) => {
    const oldSubtask = todos
      .find((todo) => todo.id === todoId)
      ?.subtasks?.find((subtask) => subtask.id === subtaskId);

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: (todo.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId),
            }
          : todo
      )
    );

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Could not delete subtask.');
      }
    } catch {
      if (oldSubtask) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === todoId
              ? { ...todo, subtasks: sortSubtasks([...(todo.subtasks ?? []), oldSubtask]) }
              : todo
          )
        );
      }
      setError('Could not delete subtask.');
    }
  }, [todos]);

  const openEdit = useCallback((todo: Todo) => {
    setEditing(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueLocal(toSingaporeInputValue(todo.due_date));
    setEditIsRecurring(todo.is_recurring);
    setEditRecurrencePattern(todo.recurrence_pattern ?? 'weekly');
    setEditReminderMinutes(todo.reminder_minutes as ReminderMinutes | null);
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

      const dueDate = editDueLocal ? fromSingaporeInputValue(editDueLocal) : null;
      if (editIsRecurring && !dueDate) {
        setError('Recurring todos require a due date.');
        return;
      }
      if (editReminderMinutes !== null && !dueDate) {
        setError('Reminders require a due date.');
        return;
      }

      const patch = {
        title: trimmed,
        priority: editPriority,
        due_date: dueDate,
        is_recurring: editIsRecurring,
        recurrence_pattern: editIsRecurring ? editRecurrencePattern : null,
        reminder_minutes: editReminderMinutes,
      };

      const target = editing;
      const optimistic: Todo = {
        ...target,
        ...patch,
      };

      setTodos((prev) => prev.map((todo) => (todo.id === target.id ? optimistic : todo)));
      closeEdit();

      try {
        const response = await fetch(`/api/todos/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? 'update failed');
        }

        const payload = (await response.json()) as TodoUpdatePayload;
        applyUpdatePayload(target.id, payload);
      } catch (err) {
        setTodos((prev) => prev.map((todo) => (todo.id === target.id ? target : todo)));
        setError((err as Error).message || 'Could not update todo.');
      }
    },
    [
      editing,
      editTitle,
      editPriority,
      editDueLocal,
      editIsRecurring,
      editRecurrencePattern,
      editReminderMinutes,
      closeEdit,
    ]
  );

  useEffect(() => {
    if (!editing) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEdit();
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Todo App</h1>
        <div className="flex flex-wrap items-center gap-2">
          <NotificationToggle />
          <button
            onClick={() => router.push('/calendar')}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            type="button"
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setShowTemplateManager(true)}
            className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
            type="button"
          >
            📋 Templates
          </button>
          <ExportImportToolbar onImported={() => void loadTodos()} />
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
            type="button"
          >
            🚪 Logout
          </button>
        </div>
      </div>

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
            onChange={(e) => {
              setDueLocal(e.target.value);
              if (!e.target.value) {
                setIsRecurring(false);
                setReminderMinutes(null);
              }
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Due date"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={!dueLocal}
            />
            Repeat
          </label>

          {isRecurring && (
            <select
              value={recurrencePattern}
              onChange={(e) => {
                const value = e.target.value;
                if (isRecurrencePattern(value)) {
                  setRecurrencePattern(value);
                }
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase()}
                  {option.slice(1)}
                </option>
              ))}
            </select>
          )}

          {!dueLocal && (
            <span className="text-xs text-gray-500">Set a due date to enable repeat and reminders</span>
          )}

          <select
            value={reminderMinutes ?? ''}
            disabled={!dueLocal}
            onChange={(e) => {
              setReminderMinutes(
                e.target.value ? (Number(e.target.value) as ReminderMinutes) : null
              );
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Reminder: None</option>
            {REMINDER_VALUES.map((minutes) => (
              <option key={minutes} value={minutes}>
                Reminder: {REMINDER_LABELS[minutes]}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!title.trim()}
            className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Subtasks section */}
        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtasks:</span>
            {subtasks.length > 0 && (
              <span className="text-xs text-gray-500">({subtasks.length})</span>
            )}
          </div>

          {subtasks.length > 0 && (
            <ul className="mt-2 space-y-1 rounded bg-gray-50 p-2 dark:bg-gray-700/30">
              {subtasks.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>• {s.title}</span>
                  <button
                    type="button"
                    onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showSubtaskInput ? (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Subtask title"
                className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (subtaskTitle.trim()) {
                      setSubtasks((prev) => [...prev, { title: subtaskTitle.trim() }]);
                      setSubtaskTitle('');
                    }
                  } else if (e.key === 'Escape') {
                    setShowSubtaskInput(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (subtaskTitle.trim()) {
                    setSubtasks((prev) => [...prev, { title: subtaskTitle.trim() }]);
                    setSubtaskTitle('');
                  }
                }}
                className="rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubtaskInput(false);
                  setSubtaskTitle('');
                }}
                className="rounded bg-gray-400 px-2 py-1 text-sm text-white hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubtaskInput(true)}
              className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              + Add subtask
            </button>
          )}
        </div>

        {/* Template actions */}
        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            {title.trim() && (
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
              >
                💾 Save as Template
              </button>
            )}
            <UseTemplateDropdown
              onTemplateSelected={(template: Template) => {
                setTitle(template.title_template);
                setPriority(template.priority);
                if (template.due_date_offset_minutes) {
                  const due = new Date(getSingaporeNow().getTime() + template.due_date_offset_minutes * 60_000);
                  setDueLocal(toSingaporeInputValue(due.toISOString()));
                  setIsRecurring(template.is_recurring);
                  setRecurrencePattern(template.recurrence_pattern ?? 'weekly');
                  setReminderMinutes(template.reminder_minutes);
                }
                if (template.subtasks_json) {
                  try {
                    const parsed = JSON.parse(template.subtasks_json);
                    setSubtasks(parsed);
                  } catch {
                    // Silent fail
                  }
                }
              }}
            />
          </div>
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
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
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
          <Section
            title="Pending"
            accent="text-gray-600 dark:text-gray-400"
            todos={sections.pending}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
          />
          <Section
            title="Completed"
            accent="text-green-600 dark:text-green-400"
            todos={sections.completed}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
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
                  onChange={(e) => {
                    setEditDueLocal(e.target.value);
                    if (!e.target.value) {
                      setEditIsRecurring(false);
                      setEditReminderMinutes(null);
                    }
                  }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  aria-label="Due date"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                    disabled={!editDueLocal}
                  />
                  Repeat
                </label>

                {editIsRecurring && (
                  <select
                    value={editRecurrencePattern}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isRecurrencePattern(value)) {
                        setEditRecurrencePattern(value);
                      }
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {RECURRENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option[0].toUpperCase()}
                        {option.slice(1)}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={editReminderMinutes ?? ''}
                  disabled={!editDueLocal}
                  onChange={(e) => {
                    setEditReminderMinutes(
                      e.target.value ? (Number(e.target.value) as ReminderMinutes) : null
                    );
                  }}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Reminder: None</option>
                  {REMINDER_VALUES.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      Reminder: {REMINDER_LABELS[minutes]}
                    </option>
                  ))}
                </select>
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

      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSaved={() => {
          resetForm();
          setSubtasks([]);
        }}
        todoDraft={{
          title,
          priority,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          reminder_minutes: reminderMinutes,
          subtasks,
        }}
      />

      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onTemplateUsed={() => void loadTodos()}
        onRefresh={() => void loadTodos()}
      />
    </main>
  );
}

function sortSubtasks(subtasks: Subtask[]): Subtask[] {
  return [...subtasks].sort((a, b) => a.position - b.position);
}
