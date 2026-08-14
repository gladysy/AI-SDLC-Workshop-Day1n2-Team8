import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { subtaskDB } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtaskId = Number(id);
  if (Number.isNaN(subtaskId)) {
    return NextResponse.json({ error: 'Invalid subtask id' }, { status: 400 });
  }

  const existing = subtaskDB.findOwnedById(subtaskId, session.userId);
  if (!existing) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const update: { title?: string; completed?: boolean } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: 'Subtask title is required' }, { status: 400 });
    }
    if (title.length > 500) {
      return NextResponse.json({ error: 'Title too long' }, { status: 400 });
    }
    update.title = title;
  }

  if (body.completed !== undefined) {
    update.completed = Boolean(body.completed);
  }

  const saved = subtaskDB.update(subtaskId, update);
  return NextResponse.json(saved);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtaskId = Number(id);
  if (Number.isNaN(subtaskId)) {
    return NextResponse.json({ error: 'Invalid subtask id' }, { status: 400 });
  }

  const existing = subtaskDB.findOwnedById(subtaskId, session.userId);
  if (!existing) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  subtaskDB.delete(subtaskId);
  return NextResponse.json({ success: true });
}
