import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todosWithTags, type TodoExport } from '@/lib/db';
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone';

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(todos: ReturnType<typeof todosWithTags>): string {
  const header = ['ID', 'Title', 'Completed', 'Due Date', 'Priority', 'Recurring', 'Pattern', 'Reminder'];
  const rows: string[] = [header.join(',')];

  todos.forEach((todo) => {
    const row = [
      String(todo.id),
      escapeCsvValue(todo.title),
      todo.completed ? 'Yes' : 'No',
      todo.due_date ? formatSingaporeDate(todo.due_date, { dateStyle: 'medium' }) : '',
      todo.priority,
      todo.is_recurring ? 'Yes' : 'No',
      todo.recurrence_pattern ?? '',
      todo.reminder_minutes?.toString() ?? '',
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get('format') ?? 'json';
  const todos = todosWithTags(session.userId);

  const dateStr = formatSingaporeDate(getSingaporeNow(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');

  if (format === 'csv') {
    const csv = toCsv(todos);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="todos-${dateStr}.csv"`,
      },
    });
  }

  // JSON format
  const todoExportItems = todos.map((todo) => ({
    title: todo.title,
    completed: todo.completed,
    due_date: todo.due_date,
    priority: todo.priority,
    is_recurring: todo.is_recurring,
    recurrence_pattern: todo.recurrence_pattern,
    reminder_minutes: todo.reminder_minutes,
    created_at: todo.created_at,
    subtasks: todo.subtasks.map((s) => ({
      title: s.title,
      completed: s.completed,
      position: s.position,
    })),
    tags: todo.tags.map((t) => ({
      name: t.name,
      color: t.color,
    })),
  }));

  const payload: TodoExport = {
    version: 1,
    exported_at: getSingaporeNow().toISOString(),
    todos: todoExportItems,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="todos-${dateStr}.json"`,
    },
  });
}
