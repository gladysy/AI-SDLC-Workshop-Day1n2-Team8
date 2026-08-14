import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB, type UpdateTodoInput } from '@/lib/db';
import { validatePriority } from '@/lib/priority';
import { calculateNextDueDate, isRecurrencePattern } from '@/lib/recurrence';
import { validateReminderMinutes } from '@/lib/reminders';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todo = todoDB.findById(Number(id));
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }
  return NextResponse.json({ ...todo, subtasks: subtaskDB.findByTodoId(todo.id) });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const existing = todoDB.findById(Number(id));
  if (!existing || existing.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const update: UpdateTodoInput = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    if (title.length > 500) {
      return NextResponse.json({ error: 'Title too long' }, { status: 400 });
    }
    update.title = title;
  }

  if (body.priority !== undefined) {
    try {
      update.priority = validatePriority(body.priority);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (body.due_date !== undefined) {
    if (body.due_date === null || body.due_date === '') {
      update.due_date = null;
    } else {
      const due = new Date(body.due_date);
      if (Number.isNaN(due.getTime())) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
      }
      update.due_date = body.due_date;
    }
  }

  if (body.completed !== undefined) update.completed = Boolean(body.completed);
  if (body.is_recurring !== undefined) update.is_recurring = Boolean(body.is_recurring);

  if (body.recurrence_pattern !== undefined) {
    if (body.recurrence_pattern !== null && !isRecurrencePattern(body.recurrence_pattern)) {
      return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
    }
    update.recurrence_pattern = body.recurrence_pattern;
  }

  if (body.reminder_minutes !== undefined) {
    try {
      update.reminder_minutes = validateReminderMinutes(body.reminder_minutes);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (body.last_notification_sent !== undefined) {
    update.last_notification_sent =
      body.last_notification_sent === null ? null : String(body.last_notification_sent);
  }

  const finalDueDate = update.due_date !== undefined ? update.due_date : existing.due_date;
  const finalIsRecurring =
    update.is_recurring !== undefined ? update.is_recurring : existing.is_recurring;
  const finalRecurrencePattern =
    update.recurrence_pattern !== undefined
      ? update.recurrence_pattern
      : existing.recurrence_pattern;
  const finalReminderMinutes =
    update.reminder_minutes !== undefined
      ? update.reminder_minutes
      : existing.reminder_minutes;

  if (finalIsRecurring && !finalDueDate) {
    return NextResponse.json(
      { error: 'Recurring todos require a due date' },
      { status: 400 }
    );
  }

  if (finalIsRecurring && !isRecurrencePattern(finalRecurrencePattern)) {
    return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
  }

  if (!finalDueDate && finalReminderMinutes !== null) {
    return NextResponse.json(
      { error: 'Reminders require a due date' },
      { status: 400 }
    );
  }

  const updated = todoDB.update(Number(id), update);

  const justCompleted = Boolean(body.completed) && existing.completed === false;
  if (
    justCompleted &&
    finalIsRecurring &&
    finalRecurrencePattern &&
    finalDueDate
  ) {
    const nextDueDate = calculateNextDueDate(finalDueDate, finalRecurrencePattern);

    const nextInstance = todoDB.create({
      user_id: existing.user_id,
      title: updated?.title ?? existing.title,
      due_date: nextDueDate,
      priority: updated?.priority ?? existing.priority,
      is_recurring: true,
      recurrence_pattern: finalRecurrencePattern,
      reminder_minutes: finalReminderMinutes,
      tag_ids: [],
    });

    return NextResponse.json({
      todo:
        updated === null
          ? null
          : { ...updated, subtasks: subtaskDB.findByTodoId(updated.id) },
      nextInstance: { ...nextInstance, subtasks: [] },
    });
  }

  return NextResponse.json({
    todo:
      updated === null ? null : { ...updated, subtasks: subtaskDB.findByTodoId(updated.id) },
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const existing = todoDB.findById(Number(id));
  if (!existing || existing.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  todoDB.delete(Number(id));
  return NextResponse.json({ success: true });
}
