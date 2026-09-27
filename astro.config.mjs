import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { processBookingRequest } from './src/lib/booking.ts';

function bookingApiPlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/booking' && req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params.entries());
      }
      const response = await processBookingRequest(body, process.env);
      res.writeHead(response.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(await response.text());
      return;
    }
    next();
  };

  return {
    name: 'booking-api-dev-preview',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  vite: { plugins: [tailwindcss(), bookingApiPlugin()] },
});
