'use client';

import { useRef, useState } from 'react';

interface ExportImportToolbarProps {
  onImported: () => void;
}

interface ImportMessage {
  type: 'success' | 'error';
  text: string;
}

export function ExportImportToolbar({ onImported }: ExportImportToolbarProps) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<ImportMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function download(format: 'json' | 'csv') {
    window.location.href = `/api/todos/export?format=${format}`;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      let body: unknown;

      try {
        body = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format');
      }

      const res = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to import todos');
      }

      setMessage({
        type: 'success',
        text: `Successfully imported ${data.imported} todos`,
      });
      onImported();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import todos',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => download('json')}
        className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        📥 Export JSON
      </button>
      <button
        onClick={() => download('csv')}
        className="rounded bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
      >
        📊 Export CSV
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {importing ? '⏳ Importing…' : '📤 Import'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      {message && (
        <span
          className={
            message.type === 'success'
              ? 'text-green-600 text-sm font-medium'
              : 'text-red-600 text-sm font-medium'
          }
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
