// PM2 configuratie voor RunON productie
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
