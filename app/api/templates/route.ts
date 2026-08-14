import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, type CreateTemplateInput } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const templates = templateDB.findAllByUser(session.userId);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as CreateTemplateInput;

  if (!body.name?.trim() || !body.title_template?.trim()) {
    return NextResponse.json(
      { error: 'Name and title are required' },
      { status: 400 }
    );
  }

  const template = templateDB.create({
    user_id: session.userId,
    name: body.name.trim(),
    description: body.description ?? null,
    category: body.category ?? null,
    title_template: body.title_template.trim(),
    priority: body.priority,
    is_recurring: body.is_recurring ?? false,
    recurrence_pattern: body.recurrence_pattern,
    reminder_minutes: body.reminder_minutes,
    due_date_offset_minutes: body.due_date_offset_minutes,
    subtasks: body.subtasks,
  });

  return NextResponse.json(template, { status: 201 });
}
