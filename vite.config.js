import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-html',
      transformIndexHtml(html) {
        return html.replace('</head>', `<meta name="build-time" content="${Date.now()}"></head>`)
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist',
  }
})
