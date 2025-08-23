import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'background-bundle': path.resolve(__dirname, 'src/global-background.js'),
        'options/options': path.resolve(__dirname, 'src/artbreeze-style-options.js'),
        'offscreen-audio': path.resolve(__dirname, 'src/offscreen-audio.js'),
        'content-script': path.resolve(__dirname, 'src/content-script.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es'
      }
    }
  },
  server: {
    port: 3000,
    hmr: {
      overlay: false
    }
  },
  optimizeDeps: {
    include: ['tone']
  },
  define: {
    global: 'globalThis'
  }
})