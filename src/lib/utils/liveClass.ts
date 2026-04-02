import type { LiveClassModel } from '@/types/models/homepage';

export type LiveClassStatus = 'upcoming' | 'live' | 'completed';

export function getLiveClassStatus(lc: LiveClassModel): LiveClassStatus {
  const now = Date.now();
  const start = new Date(lc.scheduledAt).getTime();
  const end = start + lc.durationMinutes * 60 * 1000;
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'completed';
}
