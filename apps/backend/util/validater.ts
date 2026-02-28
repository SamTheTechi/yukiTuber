import { z } from 'zod';

export const URLSchema = z
  .object({
    url: z.string().url().refine((value) => {
      try {
        const parsed = new globalThis.URL(value);
        const protocolAllowed = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        const hostname = parsed.hostname.toLowerCase();
        const isYoutubeHost =
          hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
        return protocolAllowed && isYoutubeHost;
      } catch {
        return false;
      }
    }, 'url must be a valid YouTube http/https URL'),
    quality: z.coerce.number().int().min(144).max(1080).optional().default(720),
  })
  .strict();

export type DownloadRequest = z.infer<typeof URLSchema>;
