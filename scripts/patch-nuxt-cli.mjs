/**
 * Patch @nuxt/cli to fix Windows EPERM errors during dev server restarts.
 *
 * Problem: On Windows, Nuxt's dev server crashes with EPERM when trying to
 * remove .nuxt/dev or .nuxt/dist during HMR restart cycles (file locking).
 *
 * This script patches two things:
 * 1. Disables the .nuxt/dist watcher that triggers unnecessary restarts
 * 2. Catches EPERM errors during restart so the server stays alive
 *
 * Run: node scripts/patch-nuxt-cli.mjs
 * Auto-runs via: npm postinstall
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const cliPath = resolve('node_modules/@nuxt/cli/dist/dev-KB30iboK.mjs')

let code
try {
  code = readFileSync(cliPath, 'utf-8')
} catch {
  console.log('⚠ @nuxt/cli not found, skipping patch')
  process.exit(0)
}

let patched = false

// Patch 1: Disable dist watcher on Windows
const distWatcherOrig = `this.#distWatcher.on("change", (_event, file) => {
			if (!this.#fileChangeTracker.shouldEmitChange(resolve(distDir, file || ""))) return;
			this.loadDebounced(true, ".nuxt/dist directory has been removed");
		});`

const distWatcherPatched = `// PATCHED: Disable dist watcher on Windows to prevent EPERM restart loops
		if (process.platform !== 'win32') {
		this.#distWatcher.on("change", (_event, file) => {
			if (!this.#fileChangeTracker.shouldEmitChange(resolve(distDir, file || ""))) return;
			this.loadDebounced(true, ".nuxt/dist directory has been removed");
		});
		}`

if (code.includes(distWatcherOrig)) {
  code = code.replace(distWatcherOrig, distWatcherPatched)
  patched = true
  console.log('✔ Patched dist watcher (disabled on Windows)')
}

// Patch 2: Catch EPERM errors during restart
const loadOrig = `} catch (error) {
			console.error(\`Cannot \${reload ? "restart" : "start"} nuxt: \`, error);`

const loadPatched = `} catch (error) {
			// PATCHED: On Windows, ignore EPERM errors during restart (file locking issue)
			if (process.platform === 'win32' && error && error.code === 'EPERM') {
				console.warn('[PATCHED] Ignoring EPERM error on Windows during', reload ? 'restart' : 'start');
				return;
			}
			console.error(\`Cannot \${reload ? "restart" : "start"} nuxt: \`, error);`

if (code.includes(loadOrig)) {
  code = code.replace(loadOrig, loadPatched)
  patched = true
  console.log('✔ Patched EPERM error handler (graceful fallback on Windows)')
}

if (patched) {
  writeFileSync(cliPath, code)
  console.log('✔ @nuxt/cli patched successfully for Windows')
} else if (code.includes('PATCHED')) {
  console.log('✔ @nuxt/cli already patched')
} else {
  console.log('⚠ Could not find patch targets — @nuxt/cli may have been updated')
}
