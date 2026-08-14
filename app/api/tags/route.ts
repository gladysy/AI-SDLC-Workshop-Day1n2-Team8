import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tags = tagDB.findAllByUser(session.userId);
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const trimmed = body.name?.trim();

  if (!trimmed) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
  }

  if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    return NextResponse.json({ error: 'Color must be a valid hex code' }, { status: 400 });
  }

  try {
    const tag = tagDB.create(session.userId, {
      name: trimmed,
      color: body.color ?? '#3B82F6',
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'A tag with this name already exists') {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
