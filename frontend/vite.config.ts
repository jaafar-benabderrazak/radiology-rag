import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
<<<<<<< HEAD
=======
    allowedHosts: ['all'],  // Allow all hosts for Replit deployment
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
<<<<<<< HEAD
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true
=======
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
  }
})
