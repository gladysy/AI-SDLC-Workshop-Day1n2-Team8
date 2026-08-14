'use client';

import { useState } from 'react';
import type { Priority, RecurrencePattern, Template } from '@/lib/db';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (template: Template) => void;
  todoDraft: {
    title: string;
    priority: Priority;
    is_recurring: boolean;
    recurrence_pattern: RecurrencePattern | null;
    reminder_minutes: number | null;
    subtasks: Array<{ title: string; completed?: boolean }>;
  };
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  onSaved,
  todoDraft,
}: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonCategories = ['Work', 'Personal', 'Finance', 'Health', 'Education'];

  async function handleSave() {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!todoDraft.title.trim()) {
      setError('Todo title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          title_template: todoDraft.title,
          priority: todoDraft.priority,
          is_recurring: todoDraft.is_recurring,
          recurrence_pattern: todoDraft.recurrence_pattern || undefined,
          reminder_minutes: todoDraft.reminder_minutes || undefined,
          subtasks: todoDraft.subtasks.map((s, i) => ({
            title: s.title,
            position: i,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      const template: Template = await res.json();
      setName('');
      setDescription('');
      setCategory('');
      onSaved(template);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Save as Template</h2>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekly Team Meeting"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of this template"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Work, Personal"
            list="categories-list"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <datalist id="categories-list">
            {commonCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
