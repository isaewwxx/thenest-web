import http from 'node:http';
import { spawn } from 'node:child_process';
import { processBookingRequest } from '../src/lib/booking.ts';

let port = 4321;
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];
  const next = process.argv[i + 1];
  if ((arg === '--port' || arg === '-p') && next !== undefined) {
    port = parseInt(next, 10);
  }
}

const internalPort = port + 10;

const isWin = process.platform === 'win32';
const astro = isWin
  ? spawn(
      'cmd.exe',
      [
        '/d',
        '/s',
        '/c',
        `npx astro preview --port ${internalPort} --host 127.0.0.1`,
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
  : spawn(
      'npx',
      [
        'astro',
        'preview',
        '--port',
        String(internalPort),
        '--host',
        '127.0.0.1',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

astro.stdout?.on('data', (d) => {
  const s = d.toString();
  if (process.env.DEBUG) process.stdout.write(s);
});

astro.stderr?.on('data', (d) => {
  const s = d.toString();
  process.stderr.write(s);
});

process.on('exit', () => astro.kill());
process.on('SIGINT', () => {
  astro.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  astro.kill();
  process.exit();
});

// Wait for internal server to accept connections
async function waitForInternal(url: string, maxAttempts = 120): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, () => resolve());
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error('Timed out waiting for astro preview');
}

await waitForInternal(`http://127.0.0.1:${internalPort}/`);

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(
    req.url ?? '/',
    `http://${req.headers.host || 'localhost'}`,
  );

  if (parsedUrl.pathname === '/api/booking') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      let body: unknown;
      try {
        body = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params.entries());
      }

      const acceptHeader = (req.headers.accept as string) || '';
      const response = await processBookingRequest(
        body,
        process.env,
        new Date(),
        undefined,
        acceptHeader,
      );

      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
      };

      if (response.status === 303) {
        const location = response.headers.get('location') || '/booking';
        headers['Location'] = location;
        res.writeHead(303, headers);
        res.end();
        return;
      }

      headers['Content-Type'] = 'application/json';
      res.writeHead(response.status, headers);
      res.end(await response.text());
      return;
    }
  }

  // Proxy to internal astro preview
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: internalPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode ?? 200, targetRes.headers);
    targetRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    res.writeHead(502);
    res.end(`Bad Gateway: ${err.message}`);
  });

  req.pipe(proxy, { end: true });
});

server.listen(port, '127.0.0.1', () => {
  console.log(
    `[The Nest Preview Server] Serving with direct booking API at http://127.0.0.1:${port}/`,
  );
});
