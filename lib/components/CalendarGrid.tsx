// Calendar grid component displaying a 6x7 month view (PRP 10)
'use client';

import { CalendarDay } from '@/lib/calendar';
import type { Todo, Holiday } from '@/lib/db';
import { CalendarCell } from './CalendarCell';

interface CalendarGridProps {
  year: number;
  month: number;
  days: CalendarDay[];
  todos: Todo[];
  holidays: Holiday[];
  onSelectDay: (date: string) => void;
  onNavigate: (year: number, month: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  year,
  month,
  days,
  todos,
  holidays,
  onSelectDay,
  onNavigate,
}: CalendarGridProps) {
  const today = new Date();
  const isCurrentMonth = year === today.getUTCFullYear() && month === today.getUTCMonth() + 1;

  function goToPrevMonth() {
    if (month === 1) {
      onNavigate(year - 1, 12);
    } else {
      onNavigate(year, month - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      onNavigate(year + 1, 1);
    } else {
      onNavigate(year, month + 1);
    }
  }

  function goToToday() {
    onNavigate(today.getUTCFullYear(), today.getUTCMonth() + 1);
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ◀ Previous
        </button>

        <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>

        <div className="flex gap-2">
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Today
            </button>
          )}
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-gray-100 px-2 py-2 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => {
          const dayTodos = todos.filter((t) =>
            t.due_date && t.due_date.startsWith(day.date)
          );
          const dayHoliday = holidays.find((h) => h.date === day.date);

          return (
            <CalendarCell
              key={day.date}
              day={day}
              todos={dayTodos}
              holiday={dayHoliday}
              onClick={() => onSelectDay(day.date)}
            />
          );
        })}
      </div>
    </div>
  );
}
