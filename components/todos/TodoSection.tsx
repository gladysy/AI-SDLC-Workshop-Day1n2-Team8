'use client';

import type { Todo } from '@/lib/db';
import { TodoItem } from './TodoItem';

interface SectionProps {
  title: string;
  accent: string;
  todos: Todo[];
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onTagClick?: (tagId: number) => void;
}

export function TodoSection({
  title,
  accent,
  todos,
  onToggle,
  onEdit,
  onDelete,
  onTagClick,
}: SectionProps) {
  if (todos.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className={`mb-2 text-sm font-semibold uppercase tracking-wide ${accent}`}>
        {title} ({todos.length})
      </h2>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onTagClick={onTagClick}
          />
        ))}
      </ul>
    </section>
  );
}
