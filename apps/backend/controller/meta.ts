import { type Context } from 'hono';
import { URLSchema, type DownloadRequest } from '../util/validater';
import { spawn } from 'node:child_process';

type YtDlpMetadata = {
  title?: string;
  uploader?: string;
  thumbnail?: string;
};

export const metadata = async (c: Context) => {
  let data: DownloadRequest;

  try {
    const body = await c.req.json();
    data = URLSchema.parse(body);
  } catch {
    return c.json({ msg: 'provide valid video url' }, 400);
  }

  const { url } = data;

  const proc = spawn(
    'yt-dlp',
    [
      '--skip-download',
      '-4',
      '--no-warnings',
      '--dump-single-json',
      '--no-check-certificate',
      '--add-header',
      'referer:youtube.com',
      '--add-header',
      'user-agent:googlebot',
      url,
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const closePromise = new Promise<number | null>((resolve) => {
    proc.once('close', resolve);
  });

  if (!proc.stdout) {
    proc.kill('SIGTERM');
    console.error('No stdout from yt-dlp process');
    return c.json({ msg: 'yt-dlp failed to provide output' }, 500);
  }

  let output = '';
  let stderr = '';

  proc.stdout.setEncoding('utf-8');
  proc.stderr?.setEncoding('utf-8');

  proc.stderr?.on('data', (chunk: string) => {
    stderr += chunk;
    if (stderr.length > 4000) {
      stderr = stderr.slice(-4000);
    }
  });

  proc.once('error', (err) => {
    console.error('Failed to start yt-dlp:', err);
  });

  for await (const chunk of proc.stdout) {
    output += chunk;
  }

  const exitCode = await closePromise;

  if (exitCode !== 0) {
    console.error(`yt-dlp exited with code ${exitCode}. ${stderr}`);
    return c.json({ msg: 'Failed to extract metadata' }, 502);
  }

  const jsonPayload = output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!jsonPayload) {
    return c.json({ msg: 'Failed to extract metadata' }, 500);
  }

  let parsed: YtDlpMetadata;
  try {
    parsed = JSON.parse(jsonPayload) as YtDlpMetadata;
  } catch {
    return c.json({ msg: 'Failed to parse metadata' }, 500);
  }

  const title = typeof parsed.title === 'string' ? parsed.title : '';
  const author = typeof parsed.uploader === 'string' ? parsed.uploader : '';
  const thumbnail = typeof parsed.thumbnail === 'string' ? parsed.thumbnail : '';

  if (!title || !author || !thumbnail) {
    return c.json({ msg: 'Failed to extract metadata' }, 500);
  }

  return c.json({
    title,
    author,
    thumbnail,
  });
};
