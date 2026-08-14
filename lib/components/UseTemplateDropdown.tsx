'use client';

import { useState, useEffect } from 'react';
import type { Template } from '@/lib/db';

interface UseTemplateDropdownProps {
  onTemplateSelected: (template: Template) => void;
}

export function UseTemplateDropdown({ onTemplateSelected }: UseTemplateDropdownProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen, templates.length]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data: Template[] = await res.json();
        setTemplates(data);
      }
    } catch {
      // Silent fail - dropdown still works
    } finally {
      setLoading(false);
    }
  }

  if (templates.length === 0 && !loading && isOpen) {
    return (
      <button
        type="button"
        disabled
        className="rounded border border-gray-300 px-3 py-2 text-gray-500 text-sm"
      >
        No templates yet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded border border-gray-300 px-3 py-2 text-gray-700 text-sm hover:bg-gray-50"
      >
        Use Template ▼
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded border border-gray-200 bg-white shadow-md">
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500">Loading…</div>
          ) : templates.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">No templates</div>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onTemplateSelected(template);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{template.name}</div>
                {template.category && (
                  <div className="text-xs text-gray-500">{template.category}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
