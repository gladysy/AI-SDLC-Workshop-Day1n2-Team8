'use client';

import { useState, useEffect } from 'react';
import type { Template } from '@/lib/db';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateUsed: (todo: unknown) => void;
  onRefresh: () => void;
}

export function TemplateManager({
  isOpen,
  onClose,
  onTemplateUsed,
  onRefresh,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data: Template[] = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleUseTemplate(template: Template) {
    try {
      const res = await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to use template');
      const todo = await res.json();
      onTemplateUsed(todo);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use template');
    }
  }

  async function handleDeleteTemplate(templateId: number) {
    if (!confirm('Delete this template?')) return;

    setDeleting(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template');
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleting(null);
    }
  }

  if (!isOpen) return null;

  const priorityColors = { high: 'text-red-600', medium: 'text-yellow-600', low: 'text-blue-600' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">📋 Templates</h2>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded bg-gray-50 p-8 text-center text-gray-600">
            No templates saved yet. Create a todo and save it as a template to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between rounded border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap text-xs">
                    {template.category && (
                      <span className="rounded bg-purple-100 px-2 py-1 text-purple-700">
                        {template.category}
                      </span>
                    )}
                    <span className={`rounded px-2 py-1 ${priorityColors[template.priority]} bg-gray-100`}>
                      {template.priority}
                    </span>
                    {template.is_recurring && (
                      <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                        🔄 {template.recurrence_pattern}
                      </span>
                    )}
                    {template.reminder_minutes && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                        🔔 {template.reminder_minutes}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={deleting === template.id}
                    className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting === template.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
