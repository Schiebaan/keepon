// PM2 configuratie voor RunON productie
const { readFileSync } = require('fs')
const { resolve } = require('path')

// Load .env file
const envFile = resolve(__dirname, '.env')
const envVars = {}
try {
  const lines = readFileSync(envFile, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    envVars[key] = value
  }
} catch (e) {
  console.error('Warning: could not read .env file:', e.message)
}

module.exports = {
  apps: [{
    name: 'runon',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NITRO_HOST: '127.0.0.1',
      ...envVars,
    },
    // Automatisch herstarten bij crashes
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    // Logs
    error_file: '/var/log/runon/pm2-error.log',
    out_file: '/var/log/runon/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
}
