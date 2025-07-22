import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        {
          src: 'extension/manifest.json',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist/extension', // Changed output directory
    rollupOptions: {
      input: {
        main: 'index.html', // This will be the popup
        background: 'extension/background.ts', // Entry for background script
      },
      output: {
        entryFileNames: assetInfo => {
          // Output background.js directly in the root of the output dir
          if (assetInfo.name === 'background') {
            return '[name].js';
          }
          // Keep original asset naming for other entries
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})

