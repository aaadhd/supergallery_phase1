import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Dev-only plugin: receives screenshot POSTs from the browser and saves to public/screenshots/
function screenshotReceiverPlugin() {
  return {
    name: 'screenshot-receiver',
    configureServer(server: any) {
      server.middlewares.use('/api/save-screenshot', (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end(); return;
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { filename, data } = body;
            const base64 = data.split(',')[1];
            const dir = path.join(__dirname, 'public', 'screenshots');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ ok: true }));
          } catch(e: any) {
            res.statusCode = 500; res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    screenshotReceiverPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
