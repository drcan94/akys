import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatSyncTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) { // Less than 1 minute
    return 'Az önce';
  }

  if (diff < 86400000) { // Less than 24 hours
    return formatDistanceToNow(timestamp, { locale: tr, addSuffix: true });
  }

  return format(timestamp, 'dd MMMM yyyy HH:mm', { locale: tr });
}

export function calculateSyncProgress(current: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((current / total) * 100);
}