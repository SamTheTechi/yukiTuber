import { Hono } from 'hono';
import { serve } from 'bun';
import { videoDownloader } from './controller/video.ts';
import { audioDownloader } from './controller/audio.ts';
import { metadata } from './controller/meta.ts';

const app = new Hono();

app.post('/video', videoDownloader)
app.post('/audio', audioDownloader)
app.post('/', metadata)


serve({
  fetch: app.fetch,
  port: 3000,
});

