'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Tag, CreateTagInput, UpdateTagInput } from '@/lib/db';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      if (!res.ok) throw new Error('Failed to load tags');
      const data: Tag[] = await res.json();
      setTags(data);
      setError(null);
    } catch {
      setError('Could not load tags.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (input: CreateTagInput): Promise<Tag | null> => {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create tag');
      }
      const tag: Tag = await res.json();
      setTags((prev) => [...prev, tag]);
      return tag;
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'Could not create tag.');
      return null;
    }
  }, []);

  const updateTag = useCallback(async (id: number, input: UpdateTagInput): Promise<Tag | null> => {
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update tag');
      }
      const tag: Tag = await res.json();
      setTags((prev) =>
        prev.map((t) => (t.id === id ? tag : t))
      );
      return tag;
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'Could not update tag.');
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      setTags((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      setError('Could not delete tag.');
      return false;
    }
  }, []);

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
}
