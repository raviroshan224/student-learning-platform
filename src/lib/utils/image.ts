const CDN_BASE = 'https://olp-uploads.s3.us-east-1.amazonaws.com/';

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${CDN_BASE}${url.startsWith('/') ? url.slice(1) : url}`;
}
