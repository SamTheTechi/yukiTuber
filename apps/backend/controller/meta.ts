import { type Context } from "hono";
import { URLSchema, type URL } from '../util/validater';
import { spawn } from 'bun';


export const metadata = async (c: Context) => {
  let data: URL;

  try {
    const body = await c.req.json();
    data = URLSchema.parse(body);
  } catch (err) {
    return c.json({ msg: `provide valid video url` }, 400)
  }

  let url: string = data.url

  // exec child processs to extract metadata
  const proc = spawn(
    [
      'yt-dlp',
      '--skip-download',
      '--no-warnings',
      '--print', '%(title)s||%(uploader)s||%(thumbnail)s',
      '--no-check-certificate',
      '--add-header', 'referer:youtube.com',
      '--add-header', 'user-agent:googlebot',
      url,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    }
  );

  let output = ''

  //close connections on stdout not found
  if (!proc.stdout) {
    proc.kill()
    console.error('No stdout from yt-dlp process');
    return c.json({ msg: 'yt-dlp failed to provide output' }, 500);
  }


  // gathrind metadata into output variable
  for await (const chunk of proc.stdout) {
    output += Buffer.from(chunk).toString('utf-8')
  }

  console.log(output)
  const [title, author, thumbnail] = output.trim().split('||');
  if (!title || !author || !thumbnail) {

    proc.kill()
    return c.json({ msg: 'Failed to extract metadata' }, 500);
  }

  return c.json({
    title,
    author,
    thumbnail,
  });

}



