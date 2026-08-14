// Modal showing all todos for a selected day (PRP 10)
'use client';

import { useEffect } from 'react';
import type { Todo, Holiday } from '@/lib/db';

interface DayTodosModalProps {
  date: string;
  todos: Todo[];
  holiday: Holiday | undefined;
  onClose: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export function DayTodosModal({ date, todos, holiday, onClose }: DayTodosModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const dateObj = new Date(date + 'T00:00:00Z');
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{dateStr}</h2>
            {holiday && (
              <p className="text-sm text-purple-700 font-medium">{holiday.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {todos.length === 0 ? (
            <p className="text-gray-500 text-sm">No todos scheduled for this day</p>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div key={todo.id} className="border rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      disabled
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </p>
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${
                          PRIORITY_COLORS[todo.priority] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {PRIORITY_LABELS[todo.priority]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
