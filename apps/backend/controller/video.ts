import { type Context } from "hono";
import { URLSchema, type URL } from '../util/validater';
import { stream } from 'hono/streaming';
import { spawn } from 'bun';


export const videoDownloader = async (c: Context) => {
  let data: URL;

  try {
    const body = await c.req.json();
    data = URLSchema.parse(body);

  } catch (err) {
    return c.json({ msg: `provide valid video url` }, 400)
  }

  // setting quality max to 1080p
  let url: string = data.url
  let quality: string = data.quality
  if (parseInt(quality) > 1080) {
    quality = "1080";
  }

  return stream(c, async (writer) => {

    c.header('Content-Type', 'video/mp4')
    c.header('Transfer-Encoding', 'chunked')
    let totalBytes = 0;

    // exce new process

    const proc = spawn(
      ['yt-dlp',
        '-f', `bv[ext=mp4][vcodec*=avc1][height<=${quality}]+ba[ext=m4a]/b[ext=mp4][height<=${quality}]`,
        '--merge-output-format', 'mp4',
        '-o', '-',
        url,
        '--no-check-certificate',
        '--add-header', 'referer:youtube.com',
        '--add-header', 'user-agent:googlebot'
      ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    //close connections on stdout not found
    if (!proc.stdout) {
      console.error('No stdout from yt-dlp process');
      writer.close()
      return;
    }


    // sending vidoe chunks to user
    for await (const chunk of proc.stdout) {
      writer.write(chunk)
      totalBytes += chunk.length;
    }

    // close stream on user disconnect
    c.req.raw.signal.addEventListener('abort', () => {
      proc.kill();
      writer.close();
    })

    // close stream after completion
    writer.close();
    console.log(`Download complete of ${url}`);
  })

}
