// Singapore timezone helpers. Singapore (Asia/Singapore) is a fixed UTC+8 offset
// with no daylight saving time. Pure module — safe on client and server.

export const SINGAPORE_TZ = 'Asia/Singapore';
export const SINGAPORE_OFFSET = '+08:00';

// The current instant. Instant comparisons (getTime) are timezone-independent,
// so this is correct for due-date validation and sectioning.
export function getSingaporeNow(): Date {
  return new Date();
}

// Formats an instant for display in Singapore local time.
export function formatSingaporeDate(
  input: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  if (input === null || input === undefined || input === '') return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: SINGAPORE_TZ,
    ...options,
  }).format(date);
}

// Converts a stored ISO instant into the value a <input type="datetime-local">
// expects ("YYYY-MM-DDTHH:mm"), expressed in Singapore local time.
export function toSingaporeInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SINGAPORE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  let hour = get('hour');
  if (hour === '24') hour = '00'; // some engines emit 24 for midnight
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

// Converts a datetime-local value ("YYYY-MM-DDTHH:mm") entered by the user into a
// fully-qualified ISO string, interpreting the wall-clock time as Singapore time.
export function fromSingaporeInputValue(
  local: string | null | undefined
): string | null {
  if (!local) return null;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}${SINGAPORE_OFFSET}`;
}
