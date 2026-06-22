import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // ✅ 只打包这两个核心文件，绝对不找 index.html
        content: resolve(__dirname, 'src/content/index.jsx'),
        background: resolve(__dirname, 'src/background/index.js'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
      output: {
        entryFileNames: 'src/[name]/index.js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})