import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, type UpdateTodoInput } from '@/lib/db';
import { validatePriority } from '@/lib/priority';

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
  return NextResponse.json(todo);
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
  if (body.recurrence_pattern !== undefined) update.recurrence_pattern = body.recurrence_pattern;
  if (body.reminder_minutes !== undefined) update.reminder_minutes = body.reminder_minutes;

  const updated = todoDB.update(Number(id), update);
  return NextResponse.json(updated);
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
