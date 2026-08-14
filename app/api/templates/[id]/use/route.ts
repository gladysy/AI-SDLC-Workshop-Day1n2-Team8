import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, todoDB, subtaskDB, type TemplateSubtask } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = Number(id);

  const template = templateDB.findById(templateId);
  if (!template || template.user_id !== session.userId) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Calculate due date if offset is provided
  const due_date =
    template.due_date_offset_minutes != null
      ? addMinutes(getSingaporeNow(), template.due_date_offset_minutes).toISOString()
      : null;

  // Create the todo
  const todo = todoDB.create({
    user_id: session.userId,
    title: template.title_template,
    priority: template.priority,
    due_date,
    is_recurring: template.is_recurring,
    recurrence_pattern: template.recurrence_pattern,
    reminder_minutes: template.reminder_minutes,
  });

  // Parse and create subtasks
  let subtasks: TemplateSubtask[] = [];
  if (template.subtasks_json) {
    try {
      subtasks = JSON.parse(template.subtasks_json);
    } catch {
      // Malformed JSON does not fail todo creation
      subtasks = [];
    }
  }

  const createdSubtasks = subtasks.map((s) =>
    subtaskDB.create(todo.id, { title: s.title })
  );

  return NextResponse.json(
    { ...todo, subtasks: createdSubtasks },
    { status: 201 }
  );
}
