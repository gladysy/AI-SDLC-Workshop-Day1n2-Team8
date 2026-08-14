'use client';

import type { FormEvent } from 'react';
import type { Priority } from '@/lib/priority';
import type { Tag } from '@/lib/db';
import { PrioritySelect } from './PrioritySelect';
import { TagPill } from '../tags/TagPill';

interface TodoFormProps {
  title: string;
  priority: Priority;
  dueLocal: string;
  tags: Tag[];
  selectedTagIds: number[];
  showManageTags: boolean;
  onTitleChange: (v: string) => void;
  onPriorityChange: (v: Priority) => void;
  onDueChange: (v: string) => void;
  onToggleTag: (tagId: number) => void;
  onShowManageTags: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function TodoForm({
  title,
  priority,
  dueLocal,
  tags,
  selectedTagIds,
  showManageTags,
  onTitleChange,
  onPriorityChange,
  onDueChange,
  onToggleTag,
  onShowManageTags,
  onSubmit,
}: TodoFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        aria-label="Todo title"
      />
      <div className="flex flex-wrap items-center gap-3">
        <PrioritySelect value={priority} onChange={onPriorityChange} />
        <input
          type="datetime-local"
          value={dueLocal}
          onChange={(e) => onDueChange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          aria-label="Due date"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Tags section */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {tags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              selected={selectedTagIds.includes(tag.id)}
              onClick={() => onToggleTag(tag.id)}
              size="sm"
            />
          ))}
          {showManageTags && (
            <button
              type="button"
              onClick={onShowManageTags}
              className="ml-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
            >
              + Manage Tags
            </button>
          )}
        </div>
      )}
      {tags.length === 0 && showManageTags && (
        <button
          type="button"
          onClick={onShowManageTags}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
        >
          + Manage Tags
        </button>
      )}
    </form>
  );
}
