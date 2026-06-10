import { defineConfig, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import backloop from 'vite-plugin-backloop.dev'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inject the New Relic Browser agent snippet at build time (skipped in dev).
// Same pattern as hds-webapp/vite.config.ts. NR_ENV=prod selects the
// hds-prod-* entity snippet (set by scripts/deploy-prod.sh).
function newrelicBrowser (): Plugin {
  return {
    name: 'newrelic-browser',
    transformIndexHtml: {
      order: 'post',
      handler (html, ctx) {
        if (ctx.server) return html
        const env = process.env.NR_ENV === 'prod' ? 'prod' : 'dev'
        const fileName = env === 'prod' ? 'newrelic-snippet.prod.html' : 'newrelic-snippet.html'
        const snippetPath = path.resolve(__dirname, fileName)
        if (!fs.existsSync(snippetPath)) {
          console.warn(`[newrelic-browser] ${fileName} not found — skipping injection`)
          return html
        }
        const snippet = fs.readFileSync(snippetPath, 'utf-8').trim()
        return html.replace('</head>', snippet + '\n  </head>')
      }
    }
  }
}

export default defineConfig(({ mode }) => ({
  envPrefix: ['VITE_', 'SERVICE_'],
  plugins: [
    tailwindcss(),
    react(),
    newrelicBrowser(),
    ...(mode !== 'raw' ? [backloop('auth', Number(process.env.DEV_PORT) || 4443) as unknown as PluginOption] : [])
  ],
  build: {
    outDir: 'dist'
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: true
  },
  optimizeDeps: {
    include: ['hds-lib']
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
}))
