import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GHPAGES_BASE is set by the deploy workflow so assets resolve under the
// project-pages subpath (https://<user>.github.io/<repo>/). Locally it
// stays '/'.
export default defineConfig({
  base: process.env.GHPAGES_BASE || '/',
  plugins: [react()],
})
