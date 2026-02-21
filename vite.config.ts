import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    server: {
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
    }
  }
})