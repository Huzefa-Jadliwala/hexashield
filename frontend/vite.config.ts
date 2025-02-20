import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@app': '/src/app',
      '@pages': '/src/pages',
    },
  },
  server: {
    proxy: {
      '/web/api/v1': {
        target: 'http://ec2-3-72-61-250.eu-central-1.compute.amazonaws.com:6000',
        changeOrigin: true,
        secure: false, // Set to true if using HTTPS and self-signed certificates
      },
    },
  },
})
