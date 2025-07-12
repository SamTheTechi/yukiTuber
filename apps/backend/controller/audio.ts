import { type Context } from "hono";
import { URLSchema, type URL } from '../util/validater';
import { stream } from 'hono/streaming';
import { spawn } from 'bun';

export const audioDownloader = async (c: Context) => {
  let data: URL;

  try {
    const body = await c.req.json();
    data = URLSchema.parse(body);

  } catch (err) {
    return c.json({ msg: `provide valid video url` }, 400)
  }

  let url: string = data.url

  return stream(c, async (writer) => {

    c.header('Content-Type', 'audio/mpeg')
    c.header('Transfer-Encoding', 'chunked')
    let totalBytes = 0;

    const proc = spawn(
      ['yt-dlp',
        '-f', 'bestaudio[ext=m4a]',
        '-o', '-',
        url,
        '--no-check-certificate',
        '--add-header', 'referer:youtube.com',
        '--add-header', 'user-agent:googlebot'
      ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    if (!proc.stdout) {
      console.error('No stdout from yt-dlp process');
      writer.close()
      return;
    }

    for await (const chunk of proc.stdout) {
      writer.write(chunk)
      totalBytes += chunk.length;
      console.log(`Streamed: ${totalBytes} bytes`);
    }

    c.req.raw.signal.addEventListener('abort', () => {
      proc.kill();
      writer.close();
    })

    writer.close();
    console.log(`Download complete of ${url}`);
  })

}
