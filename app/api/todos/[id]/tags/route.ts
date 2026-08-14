import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, tagDB } from '@/lib/db';

async function getParamsAndSession(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return { session: null, error: { error: 'Not authenticated' } as const };
  }
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) {
    return { session, error: { error: 'Invalid todo ID' } as const };
  }
  return { session, todoId: numId };
}

// Attach a tag to a todo (idempotent)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getParamsAndSession(request, { params });
  if (!result.session) {
    return NextResponse.json(result.error, { status: 401 });
  }
  if ('error' in result) {
    return NextResponse.json(result.error, { status: 400 });
  }

  const { session, todoId } = result;

  // Verify todo exists and belongs to user
  const todo = todoDB.findById(todoId);
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = await request.json();
  const tagId = body.tag_id;
  if (!tagId || typeof tagId !== 'number') {
    return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
  }

  const attached = tagDB.attachToTodo(todoId, tagId, session.userId);
  if (!attached) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// Detach a tag from a todo (idempotent)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getParamsAndSession(request, { params });
  if (!result.session) {
    return NextResponse.json(result.error, { status: 401 });
  }
  if ('error' in result) {
    return NextResponse.json(result.error, { status: 400 });
  }

  const { session, todoId } = result;

  // Verify todo exists and belongs to user
  const todo = todoDB.findById(todoId);
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = await request.json();
  const tagId = body.tag_id;
  if (!tagId || typeof tagId !== 'number') {
    return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
  }

  tagDB.detachFromTodo(todoId, tagId);

  return NextResponse.json({ success: true });
}
