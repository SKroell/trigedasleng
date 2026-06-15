// PM2 Ecosystem Configuration
// This file loads environment variables from .env file
require('dotenv').config();
const path = require('path');

module.exports = {
  apps: [
    {
      // --- Web app (React Router, built) ---
      name: 'trigedasleng',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        // Where the web app reaches the Python RAG service (kept private on
        // localhost). Defaults to http://127.0.0.1:8000 if unset.
        AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
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
    },
    {
      // --- Python RAG service (uvicorn) ---
      // Runs the venv's uvicorn directly so PM2 supervises the real process.
      // It reads ai-service/.env itself (key, RETRIEVAL_MODE, embedder), and
      // serves from ai-service/corpus.jsonl (+ embeddings.npy in vector mode) —
      // it does NOT touch the database at serve time, so no DB env is needed.
      // Bound to 127.0.0.1 so it is not publicly reachable; only the web app
      // calls it via AI_SERVICE_URL.
      name: 'trigedasleng-ai',
      cwd: path.join(__dirname, 'ai-service'),
      script: path.join(__dirname, 'ai-service/.venv/bin/python'), // Linux venv path
      args: '-m uvicorn trig_rag.service:app --host 127.0.0.1 --port 8000',
      interpreter: 'none', // execute the python binary directly, don't wrap with node
      error_file: path.join(__dirname, 'logs/pm2-ai-error.log'),
      out_file: path.join(__dirname, 'logs/pm2-ai-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      // Vector mode loads sentence-transformers/torch + the embed model; bump if
      // you use bge-large. Full mode needs far less.
      max_memory_restart: '2G',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
