'use client';

import type { Todo, Tag } from '@/lib/db';
import { formatSingaporeDate } from '@/lib/timezone';
import { PriorityBadge } from './PriorityBadge';
import { TagPill } from '../tags/TagPill';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onTagClick?: (tagId: number) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onTagClick,
}: TodoItemProps) {
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) => onToggle(todo, e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 dark:border-gray-600"
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`truncate font-medium ${
                  todo.completed
                    ? 'text-gray-400 line-through dark:text-gray-500'
                    : 'text-gray-800 dark:text-white'
                }`}
              >
                {todo.title}
              </p>
              <PriorityBadge priority={todo.priority} />
            </div>
            {todo.due_date && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Due {formatSingaporeDate(todo.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <button
            onClick={() => onEdit(todo)}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo)}
            className="text-red-600 hover:underline dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tags */}
      {todo.tags && todo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-8">
          {todo.tags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              selected
              size="sm"
              onClick={() => onTagClick?.(tag.id)}
            />
          ))}
        </div>
      )}
    </li>
  );
}
