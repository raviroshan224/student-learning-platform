export function formatPrice(cost?: number, discounted?: number, hasOffer?: boolean): string {
  if (!cost || cost === 0) return 'Free';
  const display = hasOffer && discounted ? discounted : cost;
  return `Rs ${display.toLocaleString('en-IN')}`;
}

export function formatOriginalPrice(cost?: number): string {
  if (!cost) return '';
  return `Rs ${cost.toLocaleString('en-IN')}`;
}

export function formatDuration(hours?: number): string {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} hrs`;
  return `${h}h ${m}m`;
}

export function formatValidity(days?: number): string {
  if (!days) return '';
  if (days >= 365) return `${Math.floor(days / 365)} Year`;
  if (days >= 30) return `${Math.floor(days / 30)} Months`;
  return `${days} Days`;
}

export function formatCountdown(examDate?: string): string {
  if (!examDate) return '';
  const diff = new Date(examDate).getTime() - Date.now();
  if (diff <= 0) return 'Exam passed';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days remaining`;
}

export function formatProgress(completed: number, total: number): string {
  return `${completed}/${total} lectures`;
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
