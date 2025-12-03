// PM2 Ecosystem Configuration
// This file loads environment variables from .env file
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'trigedasleng',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    instances: 1,
    exec_mode: 'fork',
  }]
};

