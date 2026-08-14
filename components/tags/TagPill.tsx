'use client';

import type { Tag } from '@/lib/db';

interface TagPillProps {
  tag: Tag;
  selected?: boolean;
  onClick?: (tag: Tag) => void;
  size?: 'sm' | 'md';
}

export function TagPill({ tag, selected = false, onClick, size = 'md' }: TagPillProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-3 py-1 text-sm';

  return (
    <button
      type="button"
      onClick={() => onClick?.(tag)}
      style={selected ? { backgroundColor: tag.color } : undefined}
      className={`inline-flex items-center gap-1 rounded-full border font-medium transition-colors ${sizeClasses}
        ${selected
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
    >
      {selected && <span aria-hidden>✓</span>}
      <span className="truncate max-w-[10rem]">{tag.name}</span>
    </button>
  );
}
