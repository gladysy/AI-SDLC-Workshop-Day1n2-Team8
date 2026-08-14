'use client';

import type { FormEvent } from 'react';
import type { Todo, Tag } from '@/lib/db';
import type { Priority } from '@/lib/priority';
import { PrioritySelect } from './PrioritySelect';
import { TagPill } from '../tags/TagPill';
import { toSingaporeInputValue } from '@/lib/timezone';

interface TodoEditModalProps {
  editing: Todo | null;
  allTags: Tag[];
  selectedTagIds: number[];
  editTitle: string;
  editPriority: Priority;
  editDueLocal: string;
  onUpdateTitle: (v: string) => void;
  onUpdatePriority: (v: Priority) => void;
  onUpdateDue: (v: string) => void;
  onToggleTag: (tagId: number) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export function TodoEditModal({
  editing,
  allTags,
  selectedTagIds,
  editTitle,
  editPriority,
  editDueLocal,
  onUpdateTitle,
  onUpdatePriority,
  onUpdateDue,
  onToggleTag,
  onSubmit,
  onClose,
}: TodoEditModalProps) {
  if (!editing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit todo"
      >
        <h2 className="mb-4 text-lg font-semibold">Edit Todo</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            aria-label="Todo title"
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrioritySelect value={editPriority} onChange={onUpdatePriority} />
            <input
              type="datetime-local"
              value={editDueLocal}
              onChange={(e) => onUpdateDue(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              aria-label="Due date"
            />
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {allTags.map((tag) => (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onClick={() => onToggleTag(tag.id)}
                  size="sm"
                />
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!editTitle.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
