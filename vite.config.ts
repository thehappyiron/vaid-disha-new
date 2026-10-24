import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

function emailDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'email-dev-plugin',
    configureServer(server) {
      if (!process.env.RESEND_API_KEY && env.RESEND_API_KEY) {
        process.env.RESEND_API_KEY = env.RESEND_API_KEY;
      }
      if (!process.env.RESEND_FROM_EMAIL && env.RESEND_FROM_EMAIL) {
        process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/api/email/')) {
          return next();
        }

        const pathname = url.split('?')[0];
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          let body: Record<string, unknown> = {};
          try {
            const raw = Buffer.concat(chunks).toString('utf-8');
            body = raw ? JSON.parse(raw) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');

          try {
            // Dynamically import server email handlers
            const emailModule = await import('./server/email.mjs');
            if (pathname === '/api/email/send-otp') {
              const result = await emailModule.sendVerificationOtp(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            if (pathname === '/api/email/verify-otp') {
              const result = emailModule.verifyOtp(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            if (pathname === '/api/email/activity') {
              const result = await emailModule.sendActivityEmail(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Email endpoint not found' }));
          } catch (err: any) {
            res.statusCode = err?.status || 500;
            res.end(
              JSON.stringify({
                error: err?.message || 'Server error occurred while handling email request.',
                details: err?.details,
              })
            );
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), emailDevPlugin(env)],
    server: {
      proxy: {
        // Proxy voice or other non-email API endpoints to port 8787 if running
        '^/api/(?!email)': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  };
})

