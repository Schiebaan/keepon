// Custom dev script that patches the .nuxt/dist watcher issue on Windows
// Usage: node dev.mjs
import { execa } from 'execa'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { mkdir, rm } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const nuxtDir = resolve(__dirname, '.nuxt')

// Pre-create the directories to avoid race conditions
try {
  await rm(nuxtDir, { recursive: true, force: true })
} catch {}
await mkdir(resolve(nuxtDir, 'dev'), { recursive: true })
await mkdir(resolve(nuxtDir, 'dist'), { recursive: true })

// Start nuxt dev
const child = execa('npx', ['nuxt', 'dev', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NUXT_TELEMETRY_DISABLED: '1',
  },
})

child.catch(() => {})
