'use client';

interface FilterActionsProps {
  visible: boolean;
  onClearAll: () => void;
  onSaveFilter: () => void;
}

export function FilterActions({ visible, onClearAll, onSaveFilter }: FilterActionsProps) {
  if (!visible) return null;

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        Clear All
      </button>
      <button
        type="button"
        onClick={onSaveFilter}
        className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
      >
        💾 Save Filter
      </button>
    </div>
  );
}
