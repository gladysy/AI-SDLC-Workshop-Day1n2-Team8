import { PRIORITY_LABELS, PRIORITY_VALUES, type Priority } from '@/lib/priority';

export function PrioritySelect({
  value,
  onChange,
  id,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    >
      {PRIORITY_VALUES.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p]}
        </option>
      ))}
    </select>
  );
}
