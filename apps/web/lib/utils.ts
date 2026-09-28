/**
 * Format a date/string as "21 Mar 2026, 14:30"
 */
export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace(',', '');
}

/** Truncate a string to n characters */
export function truncate(str: string, n = 60): string {
    return str.length > n ? str.slice(0, n) + '…' : str;
}