// Single source of truth for the database and todo persistence.
// SERVER-ONLY: imports better-sqlite3. Never import this from a client component;
// use `import type { Todo } from '@/lib/db'` for types (erased at build time).

import Database from 'better-sqlite3';
import path from 'node:path';
import { getSingaporeNow } from './timezone';
import { validatePriority, type Priority } from './priority';
import type { ReminderMinutes } from './reminders';

export type { Priority };
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: ReminderMinutes | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string | null;
  subtasks?: Subtask[];
}

export interface CreateTodoInput {
  title: string;
  due_date?: string | null;
  priority?: Priority;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: ReminderMinutes | null;
  tag_ids?: number[];
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  completed?: boolean;
  last_notification_sent?: string | null;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
}

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'todos.db');

let _db: Database.Database | null = null;

// Lazily open the database on first use. Opening the connection at module load
// breaks `next build` page-data collection, where multiple workers import the
// route modules concurrently and contend on the SQLite file lock (SQLITE_BUSY).
function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_pattern TEXT,
      reminder_minutes INTEGER,
      last_notification_sent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
  `);
  _db = db;
  return _db;
}

interface TodoRow {
  id: number;
  user_id: number;
  title: string;
  completed: number;
  due_date: string | null;
  priority: string;
  is_recurring: number;
  recurrence_pattern: string | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string | null;
}

interface SubtaskRow {
  id: number;
  todo_id: number;
  title: string;
  completed: number;
  position: number;
  created_at: string;
}

interface OwnedSubtaskRow extends SubtaskRow {
  user_id: number;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    completed: Boolean(row.completed),
    due_date: row.due_date,
    priority: row.priority as Priority,
    is_recurring: Boolean(row.is_recurring),
    recurrence_pattern: row.recurrence_pattern as RecurrencePattern | null,
    reminder_minutes: row.reminder_minutes as ReminderMinutes | null,
    last_notification_sent: row.last_notification_sent,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    todo_id: row.todo_id,
    title: row.title,
    completed: Boolean(row.completed),
    position: row.position,
    created_at: row.created_at,
  };
}

export interface UserRecord {
  id: number;
  username: string;
}

export const userDB = {
  // Returns the first user, creating a default local user if none exist.
  // Used by the development auth stub (see lib/auth.ts) until PRP 11 lands.
  ensureDefault(): UserRecord {
    const db = getDb();
    const existing = db
      .prepare('SELECT id, username FROM users ORDER BY id LIMIT 1')
      .get() as UserRecord | undefined;
    if (existing) return existing;

    const info = db
      .prepare('INSERT INTO users (username, created_at) VALUES (?, ?)')
      .run('local-user', getSingaporeNow().toISOString());
    return { id: Number(info.lastInsertRowid), username: 'local-user' };
  },

  findById(id: number): UserRecord | null {
    const row = getDb()
      .prepare('SELECT id, username FROM users WHERE id = ?')
      .get(id) as UserRecord | undefined;
    return row ?? null;
  },
};

export const todoDB = {
  create(input: CreateTodoInput & { user_id: number }): Todo {
    const now = getSingaporeNow().toISOString();
    const info = getDb()
      .prepare(`
        INSERT INTO todos (
          user_id, title, completed, due_date, priority, is_recurring,
          recurrence_pattern, reminder_minutes, last_notification_sent, created_at, updated_at
        ) VALUES (
          @user_id, @title, @completed, @due_date, @priority, @is_recurring,
          @recurrence_pattern, @reminder_minutes, @last_notification_sent, @created_at, @updated_at
        )
      `)
      .run({
      user_id: input.user_id,
      title: input.title,
      completed: 0,
      due_date: input.due_date ?? null,
      priority: validatePriority(input.priority),
      is_recurring: input.is_recurring ? 1 : 0,
      recurrence_pattern: input.recurrence_pattern ?? null,
      reminder_minutes: input.reminder_minutes ?? null,
      last_notification_sent: null,
      created_at: now,
      updated_at: null,
    });
    // tag_ids intentionally ignored here — tags are owned by PRP 06.
    return this.findById(Number(info.lastInsertRowid))!;
  },

  findAllByUser(userId: number): Todo[] {
    const rows = getDb()
      .prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as TodoRow[];
    return rows.map(rowToTodo);
  },

  findById(id: number): Todo | null {
    const row = getDb().prepare('SELECT * FROM todos WHERE id = ?').get(id) as
      | TodoRow
      | undefined;
    return row ? rowToTodo(row) : null;
  },

  findDueReminders(userId: number, now: Date): Todo[] {
    const nowIso = now.toISOString();
    const rows = getDb()
      .prepare(`
        SELECT * FROM todos
        WHERE user_id = ?
          AND completed = 0
          AND due_date IS NOT NULL
          AND reminder_minutes IS NOT NULL
          AND last_notification_sent IS NULL
          AND unixepoch(due_date, '-' || reminder_minutes || ' minutes') <= unixepoch(?)
          AND unixepoch(due_date) >= unixepoch(?)
      `)
      .all(userId, nowIso, nowIso) as TodoRow[];
    return rows.map(rowToTodo);
  },

  update(id: number, input: UpdateTodoInput): Todo | null {
    const db = getDb();
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.title !== undefined) {
      fields.push('title = @title');
      params.title = input.title;
    }
    if (input.due_date !== undefined) {
      fields.push('due_date = @due_date');
      params.due_date = input.due_date ?? null;
    }
    if (input.priority !== undefined) {
      fields.push('priority = @priority');
      params.priority = validatePriority(input.priority);
    }
    if (input.completed !== undefined) {
      fields.push('completed = @completed');
      params.completed = input.completed ? 1 : 0;
    }
    if (input.is_recurring !== undefined) {
      fields.push('is_recurring = @is_recurring');
      params.is_recurring = input.is_recurring ? 1 : 0;
    }
    if (input.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = @recurrence_pattern');
      params.recurrence_pattern = input.recurrence_pattern ?? null;
    }
    if (input.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = @reminder_minutes');
      params.reminder_minutes = input.reminder_minutes ?? null;
    }
    const shouldResetNotification =
      input.due_date !== undefined || input.reminder_minutes !== undefined;

    if (!shouldResetNotification && input.last_notification_sent !== undefined) {
      fields.push('last_notification_sent = @last_notification_sent');
      params.last_notification_sent = input.last_notification_sent;
    }

    if (shouldResetNotification) {
      fields.push('last_notification_sent = @reset_last_notification_sent');
      params.reset_last_notification_sent = null;
    }

    fields.push('updated_at = @updated_at');
    params.updated_at = getSingaporeNow().toISOString();

    db.prepare(`UPDATE todos SET ${fields.join(', ')} WHERE id = @id`).run(params);
    return this.findById(id);
  },

  delete(id: number): void {
    // FK ON DELETE CASCADE removes related subtasks/tag links (PRP 05/06) once those exist.
    getDb().prepare('DELETE FROM todos WHERE id = ?').run(id);
  },
};

export const subtaskDB = {
  findByTodoId(todoId: number): Subtask[] {
    const rows = getDb()
      .prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC')
      .all(todoId) as SubtaskRow[];
    return rows.map(rowToSubtask);
  },

  findOwnedById(id: number, userId: number): Subtask | null {
    const row = getDb()
      .prepare(
        `
          SELECT s.*, t.user_id
          FROM subtasks s
          JOIN todos t ON t.id = s.todo_id
          WHERE s.id = ?
        `
      )
      .get(id) as OwnedSubtaskRow | undefined;

    if (!row || row.user_id !== userId) {
      return null;
    }

    return rowToSubtask(row);
  },

  create(todoId: number, input: CreateSubtaskInput): Subtask {
    const db = getDb();
    const maxRow = db
      .prepare('SELECT MAX(position) AS max_position FROM subtasks WHERE todo_id = ?')
      .get(todoId) as { max_position: number | null };
    const nextPosition = (maxRow.max_position ?? -1) + 1;

    const info = db
      .prepare(
        `
          INSERT INTO subtasks (todo_id, title, completed, position, created_at)
          VALUES (@todo_id, @title, @completed, @position, @created_at)
        `
      )
      .run({
        todo_id: todoId,
        title: input.title,
        completed: 0,
        position: nextPosition,
        created_at: getSingaporeNow().toISOString(),
      });

    return this.findById(Number(info.lastInsertRowid))!;
  },

  findById(id: number): Subtask | null {
    const row = getDb().prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as
      | SubtaskRow
      | undefined;
    return row ? rowToSubtask(row) : null;
  },

  update(id: number, input: UpdateSubtaskInput): Subtask | null {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.title !== undefined) {
      fields.push('title = @title');
      params.title = input.title;
    }

    if (input.completed !== undefined) {
      fields.push('completed = @completed');
      params.completed = input.completed ? 1 : 0;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    getDb().prepare(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = @id`).run(params);
    return this.findById(id);
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  },
};
