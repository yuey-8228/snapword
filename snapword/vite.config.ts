import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to GitHub Pages under /snapword/ — assets must resolve from there.
// Local dev (`vite`) keeps serving from '/'.
const base = process.env.GITHUB_ACTIONS ? '/snapword/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
