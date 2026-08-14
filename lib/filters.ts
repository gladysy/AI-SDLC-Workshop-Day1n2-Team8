import type { Todo } from "./db";
import type { Priority } from "./priority";

export interface FilterState {
  search: string;
  priority: Priority | "all";
  tagId: number | "all";
  completion: "all" | "incomplete" | "completed";
  dueDateFrom: string | null;
  dueDateTo: string | null;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  search: "",
  priority: "all",
  tagId: "all",
  completion: "all",
  dueDateFrom: null,
  dueDateTo: null,
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.search.trim() !== "" ||
    f.priority !== "all" ||
    f.tagId !== "all" ||
    f.completion !== "all" ||
    f.dueDateFrom !== null ||
    f.dueDateTo !== null
  );
}

// Filters combine with AND logic, applied in this order:
// search → priority → tag → completion → date range
export function applyFilters(todos: Todo[], filters: FilterState): Todo[] {
  let result = todos;

  // 1. Search (title OR any subtask title, case-insensitive, partial match)
  const query = filters.search.trim().toLowerCase();
  if (query) {
    result = result.filter((todo) => {
      if (todo.title.toLowerCase().includes(query)) return true;
      return (todo.subtasks ?? []).some((st: { title: string }) =>
        st.title.toLowerCase().includes(query),
      );
    });
  }

  // 2. Priority
  if (filters.priority !== "all") {
    result = result.filter((todo) => todo.priority === filters.priority);
  }

  // 3. Tag
  if (filters.tagId !== "all") {
    result = result.filter((todo) =>
      (todo.tags ?? []).some((tag) => tag.id === filters.tagId),
    );
  }

  // 4. Completion status
  if (filters.completion === "incomplete") {
    result = result.filter((todo) => !todo.completed);
  } else if (filters.completion === "completed") {
    result = result.filter((todo) => todo.completed);
  }

  // 5. Due date range (only matches todos WITH a due_date)
  if (filters.dueDateFrom || filters.dueDateTo) {
    result = result.filter((todo) => {
      if (!todo.due_date) return false;
      const due = todo.due_date.slice(0, 10); // 'YYYY-MM-DD'
      if (filters.dueDateFrom && due < filters.dueDateFrom) return false;
      if (filters.dueDateTo && due > filters.dueDateTo) return false;
      return true;
    });
  }

  return result;
}

// Filter presets (localStorage)
export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

const PRESETS_KEY = "todo-app:filter-presets";

export function loadPresets(): FilterPreset[] {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return [];
    }
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePreset(preset: FilterPreset): FilterPreset[] {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return [];
    }
    const presets = [...loadPresets(), preset];
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return presets;
  } catch {
    return loadPresets();
  }
}

export function deletePreset(id: string): FilterPreset[] {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return [];
    }
    const presets = loadPresets().filter((p) => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return presets;
  } catch {
    return loadPresets();
  }
}

// Format filter state for display in Save Filter modal preview
export function formatFilterPreview(
  filters: FilterState,
  tags?: Array<{ id: number; name: string }>,
): string {
  const parts: string[] = [];

  if (filters.search.trim()) {
    parts.push(`Search: "${filters.search.trim()}"`);
  }

  const priorityLabels: Record<string, string> = {
    all: "All",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  if (filters.priority !== "all") {
    parts.push(`Priority: ${priorityLabels[filters.priority]}`);
  }

  if (filters.tagId !== "all" && tags) {
    const tag = tags.find((t) => t.id === filters.tagId);
    if (tag) {
      parts.push(`Tag: ${tag.name}`);
    }
  }

  if (filters.completion !== "all") {
    const completionLabels: Record<string, string> = {
      incomplete: "Incomplete",
      completed: "Completed",
    };
    parts.push(
      `Completion: ${completionLabels[filters.completion] || filters.completion}`,
    );
  }

  if (filters.dueDateFrom && filters.dueDateTo) {
    parts.push(`Date: ${filters.dueDateFrom} to ${filters.dueDateTo}`);
  } else if (filters.dueDateFrom) {
    parts.push(`Date from: ${filters.dueDateFrom}`);
  } else if (filters.dueDateTo) {
    parts.push(`Date to: ${filters.dueDateTo}`);
  }

  return parts.join(" · ");
}
