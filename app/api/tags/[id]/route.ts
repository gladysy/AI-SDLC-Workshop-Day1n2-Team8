import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

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
    return { session, error: { error: 'Invalid tag ID' } as const };
  }
  return { session, id: numId };
}

export async function PUT(
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

  const { id } = result;

  const existing = tagDB.findById(id);
  if (!existing || existing.user_id !== result.session.userId) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  const body = await request.json();

  try {
    const updated = tagDB.update(id, {
      name: body.name,
      color: body.color,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'A tag with this name already exists') {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }
    if (err.message?.includes('hex')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

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

  const existing = tagDB.findById(result.id);
  if (!existing || existing.user_id !== result.session.userId) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  tagDB.delete(result.id);

  return NextResponse.json({ success: true });
}
