import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Проксі — всі запити /api/* автоматично йдуть на Spring Boot
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
