"use client";

import { useState } from "react";
import type { FilterState, FilterPreset } from "@/lib/filters";
import type { Tag } from "@/lib/db";
import { formatFilterPreview } from "@/lib/filters";
import { getSingaporeNow } from "@/lib/timezone";

interface SaveFilterPresetModalProps {
  filters: FilterState;
  tags: Tag[];
  onClose: () => void;
  onSave: (preset: FilterPreset) => void;
}

export function SaveFilterPresetModal({
  filters,
  tags,
  onClose,
  onSave,
}: SaveFilterPresetModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = formatFilterPreview(filters, tags);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    const preset: FilterPreset = {
      id: crypto.randomUUID(),
      name: trimmed,
      filters,
      createdAt: getSingaporeNow().toISOString(),
    };

    onSave(preset);
    onClose();
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
        aria-label="Save filter preset"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Save Filter Preset
        </h2>

        <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {preview}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Today's High Priority"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
