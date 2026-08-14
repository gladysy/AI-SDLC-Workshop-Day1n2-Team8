'use client';

import { useState } from 'react';
import type { Tag, CreateTagInput, UpdateTagInput } from '@/lib/db';
import { TagPill } from './TagPill';

interface ManageTagsModalProps {
  tags: Tag[];
  error: string | null;
  onClose: () => void;
  onCreate: (input: CreateTagInput) => Promise<Tag | null>;
  onUpdate: (id: number, input: UpdateTagInput) => Promise<Tag | null>;
  onDelete: (id: number) => Promise<boolean>;
}

export function ManageTagsModal({
  tags,
  error,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: ManageTagsModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const input: CreateTagInput = { name: trimmed, color };

    if (editingId !== null) {
      // Update mode
      await onUpdate(editingId, input);
      setEditingId(null);
    } else {
      // Create mode
      await onCreate(input);
    }

    setName('');
    setColor('#3B82F6');
    setCreateError(null);
    setIsSubmitting(false);
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
    setCreateError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setColor('#3B82F6');
    setCreateError(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tag? It will be removed from all todos.')) return;
    await onDelete(id);
    if (editingId === id) {
      cancelEdit();
    }
  };

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
        aria-label="Manage tags"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Manage Tags
        </h2>

        {/* Tag list */}
        {tags.length > 0 && (
          <ul className="mb-4 space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between gap-2">
                <TagPill tag={tag} selected />
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tags.length === 0 && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            No tags yet. Create one below.
          </p>
        )}

        {/* Create/edit form */}
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={editingId ? 'New name' : 'Tag name'}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus={!!editingId}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Create Tag'}
            </button>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cancel editing
            </button>
          )}
        </form>

        {(createError || error) && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-600 dark:text-red-400"
          >
            {createError || error}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
