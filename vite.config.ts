import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import backloop from 'vite-plugin-backloop.dev'

export default defineConfig(({ mode }) => ({
  envPrefix: ['VITE_', 'SERVICE_'],
  plugins: [
    tailwindcss(),
    react(),
    ...(mode !== 'raw' ? [backloop('auth', 4443) as unknown as PluginOption] : [])
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
