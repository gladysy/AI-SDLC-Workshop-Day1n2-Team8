// Individual calendar day cell (PRP 10)
'use client';

import { CalendarDay } from '@/lib/calendar';
import type { Todo, Holiday } from '@/lib/db';

interface CalendarCellProps {
  day: CalendarDay;
  todos: Todo[];
  holiday: Holiday | undefined;
  onClick: () => void;
}

const MAX_VISIBLE_TODOS = 3;

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export function CalendarCell({ day, todos, holiday, onClick }: CalendarCellProps) {
  const visible = todos.slice(0, MAX_VISIBLE_TODOS);
  const overflow = todos.length - visible.length;

  const baseClasses =
    'min-h-24 p-2 border-b border-r cursor-pointer hover:bg-gray-100 transition-colors';
  const bgClasses = day.isToday
    ? 'bg-blue-50'
    : day.isCurrentMonth
      ? 'bg-white'
      : 'bg-gray-50';
  const textClasses = !day.isCurrentMonth ? 'text-gray-400' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${bgClasses} ${textClasses} text-left`}
    >
      <div className="text-sm font-semibold mb-1">
        {day.date.split('-')[2]}
      </div>

      {holiday && (
        <div className="text-xs font-medium text-purple-700 bg-purple-100 rounded px-1 py-0.5 mb-1 truncate">
          {holiday.name}
        </div>
      )}

      <div className="space-y-0.5">
        {visible.map((todo) => (
          <div
            key={todo.id}
            className={`text-xs text-white rounded px-1.5 py-0.5 truncate ${
              PRIORITY_COLORS[todo.priority] || 'bg-gray-500'
            }`}
          >
            {todo.title}
          </div>
        ))}
      </div>

      {overflow > 0 && (
        <div className="text-xs text-gray-600 font-medium mt-1">
          +{overflow} more
        </div>
      )}
    </button>
  );
}
