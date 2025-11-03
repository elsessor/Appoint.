// Small date utility helpers to produce local YYYY-MM-DD strings and parse/compose dates.
// Use local getters (getFullYear/getMonth/getDate) to avoid timezone shifts from toISOString().

export function pad(n) {
  return String(n).padStart(2, '0');
}

// format Date -> 'YYYY-MM-DD' (local date)
export function formatYMD(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    // if it's already a YYYY-MM-DD-like string, return as-is
    // quick check: contains 2 hyphens
    if (date.includes('-')) return date;
    date = new Date(date);
  }
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

// parse 'YYYY-MM-DD' -> Date at local midnight
export function parseYMD(ymd) {
  if (!ymd) return null;
  const parts = String(ymd).split('-');
  if (parts.length < 3) return new Date(ymd);
  const [y, m, d] = parts.map(Number);
  return new Date(y, m - 1, d);
}

// combine date string 'YYYY-MM-DD' and time 'HH:MM' into a local Date
export function combineDateAndTime(ymd, time) {
  if (!ymd) return null;
  const date = parseYMD(ymd);
  if (!date) return null;
  if (!time) return date;
  const [hh, mm] = time.split(':').map(Number);
  date.setHours(hh || 0, mm || 0, 0, 0);
  return date;
}

// format time 'HH:MM' -> 'h:MM A.M.' or 'h:MM P.M.'
export function formatTime12(time) {
  if (!time) return '';
  const parts = time.split(':');
  const hour = Number(parts[0] || 0);
  const min = String(Number(parts[1] || 0)).padStart(2, '0');
  const ampm = hour >= 12 ? 'P.M.' : 'A.M.';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${min} ${ampm}`;
}

export function todayYMD() {
  return formatYMD(new Date());
}

export default {
  pad,
  formatYMD,
  parseYMD,
  combineDateAndTime,
  formatTime12,
  todayYMD,
};