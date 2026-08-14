// Calendar view page (PRP 10)
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateCalendarGrid, parseMonthParam, formatMonthParam } from '@/lib/calendar';
import { CalendarGrid } from '@/lib/components/CalendarGrid';
import { DayTodosModal } from '@/lib/components/DayTodosModal';
import type { Todo, Holiday } from '@/lib/db';

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { year, month } = parseMonthParam(searchParams.get('month'));

  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch todos and holidays
  useEffect(() => {
    async function fetchData() {
      try {
        const [todosRes, holidaysRes] = await Promise.all([
          fetch('/api/todos'),
          fetch(`/api/holidays?year=${year}&month=${month}`),
        ]);

        if (todosRes.ok) {
          const data = await todosRes.json();
          setTodos(data.todos || []);
        }

        if (holidaysRes.ok) {
          const data = await holidaysRes.json();
          setHolidays(data.holidays || []);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [year, month]);

  function handleNavigate(nextYear: number, nextMonth: number) {
    router.push(`/calendar?month=${formatMonthParam(nextYear, nextMonth)}`);
  }

  const days = generateCalendarGrid(year, month);
  const selectedDateTodo = selectedDate
    ? todos.filter((t) => t.due_date && t.due_date.startsWith(selectedDate))
    : [];
  const selectedDateHoliday = selectedDate
    ? holidays.find((h) => h.date === selectedDate)
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <a href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← Back to List
        </a>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        days={days}
        todos={todos}
        holidays={holidays}
        onSelectDay={setSelectedDate}
        onNavigate={handleNavigate}
      />

      {selectedDate && (
        <DayTodosModal
          date={selectedDate}
          todos={selectedDateTodo}
          holiday={selectedDateHoliday}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading calendar...</p>
        </div>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
