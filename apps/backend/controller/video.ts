import { type Context } from 'hono';
import { URLSchema, type DownloadRequest } from '../util/validater';
import { stream } from 'hono/streaming';
import { spawn } from 'node:child_process';

export const videoDownloader = async (c: Context) => {
  let data: DownloadRequest;

  try {
    const raw = await c.req.text();

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      const repaired = raw.replace(/\\([?=&])/g, '$1');
      body = JSON.parse(repaired);
    }

    data = URLSchema.parse(body);
  } catch {
    return c.json({ msg: 'provide valid video url' }, 400);
  }

  const url = data.url;
  const quality = Math.min(data.quality, 720);

  return stream(c, async (writer) => {
    c.header('Content-Type', 'video/mp4');
    c.header('Transfer-Encoding', 'chunked');

    const proc = spawn(
      'yt-dlp',
      [
        '-f',
        '-4',
        `bv[ext=mp4][vcodec*=avc1][height<=${quality}]+ba[ext=m4a]/b[ext=mp4][height<=${quality}]`,
        '--merge-output-format',
        'mp4',
        '-o',
        '-',
        url,
        '--no-check-certificate',
        '--add-header',
        'referer:youtube.com',
        '--add-header',
        'user-agent:googlebot',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let closed = false;
    let clientAborted = false;
    let stderr = '';

    const closeWriter = () => {
      if (closed) {
        return;
      }
      closed = true;
      try {
        writer.close();
      } catch {
        // Ignore writer close errors on already-closed streams.
      }
    };

    const abortHandler = () => {
      clientAborted = true;
      proc.kill('SIGTERM');
      closeWriter();
    };

    if (c.req.raw.signal.aborted) {
      abortHandler();
      return;
    }

    c.req.raw.signal.addEventListener('abort', abortHandler, { once: true });

    proc.once('error', (err) => {
      console.error('Failed to start yt-dlp:', err);
      closeWriter();
    });

    proc.stderr?.setEncoding('utf-8');
    proc.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 4000) {
        stderr = stderr.slice(-4000);
      }
    });

    if (!proc.stdout) {
      console.error('No stdout from yt-dlp process');
      c.req.raw.signal.removeEventListener('abort', abortHandler);
      closeWriter();
      return;
    }

    try {
      for await (const chunk of proc.stdout) {
        if (clientAborted) {
          break;
        }
        await writer.write(chunk);
      }

      const exitCode = await new Promise<number | null>((resolve) => {
        proc.once('close', resolve);
      });
      ;

      if (!clientAborted && exitCode !== 0) {
        console.error(`yt-dlp exited with code ${exitCode}. ${stderr}`);
      }

      if (!clientAborted) {
        console.log(`Download complete of ${url}`);
      }
    } finally {
      c.req.raw.signal.removeEventListener('abort', abortHandler);
      closeWriter();
    }
  });
};
