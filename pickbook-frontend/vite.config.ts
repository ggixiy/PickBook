import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Додаємо цей рядок, щоб Vite дозволив запити від ngrok
    allowedHosts: ['arron-nonsynchronic-carlyn.ngrok-free.dev'], 
    
    // Ваш існуючий проксі — всі запити /api/* автоматично йдуть на Spring Boot
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})