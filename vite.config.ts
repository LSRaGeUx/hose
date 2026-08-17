import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// Vite only exposes VITE_-prefixed variables, and only via import.meta.env.
// Server-side secrets (DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY)
// have to be put on process.env explicitly, or src/env.ts sees them as absent
// during dev and build. In production the host supplies them directly.
loadDotenv({ path: ['.env.local', '.env'], quiet: true })

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), netlify(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
