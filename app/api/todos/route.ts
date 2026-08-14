import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';
import { validatePriority } from '@/lib/priority';
import { isRecurrencePattern } from '@/lib/recurrence';
import { validateReminderMinutes } from '@/lib/reminders';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const todos = todoDB.findAllByUser(session.userId).map((todo) => ({
    ...todo,
    subtasks: subtaskDB.findByTodoId(todo.id),
  }));
  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (title.length > 500) {
    return NextResponse.json({ error: 'Title too long' }, { status: 400 });
  }

  let priority;
  try {
    priority = validatePriority(body.priority);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  let due_date: string | null = null;
  if (body.due_date) {
    const due = new Date(body.due_date);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
    }
    const minDue = new Date(getSingaporeNow().getTime() + 60_000);
    if (due < minDue) {
      return NextResponse.json(
        { error: 'Due date must be at least 1 minute in the future' },
        { status: 400 }
      );
    }
    due_date = body.due_date;
  }

  const isRecurring = Boolean(body.is_recurring);
  const recurrencePattern = body.recurrence_pattern ?? null;

  if (isRecurring && !due_date) {
    return NextResponse.json(
      { error: 'Recurring todos require a due date' },
      { status: 400 }
    );
  }

  if (isRecurring && !isRecurrencePattern(recurrencePattern)) {
    return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
  }

  let reminderMinutes: ReturnType<typeof validateReminderMinutes>;
  try {
    reminderMinutes = validateReminderMinutes(body.reminder_minutes);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!due_date && reminderMinutes !== null) {
    return NextResponse.json(
      { error: 'Reminders require a due date' },
      { status: 400 }
    );
  }

  const todo = todoDB.create({
    user_id: session.userId,
    title,
    due_date,
    priority,
    is_recurring: isRecurring,
    recurrence_pattern: isRecurring ? recurrencePattern : null,
    reminder_minutes: reminderMinutes,
    tag_ids: body.tag_ids ?? [],
  });

  return NextResponse.json(todo, { status: 201 });
}
