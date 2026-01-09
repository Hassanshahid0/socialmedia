module.exports = {
  apps: [
    {
      name: 'socialmedia-backend',
      cwd: './backend',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
        CLIENT_URL: 'http://4.211.134.149:5173,https://4.211.134.149:5173',
        // Set these per environment
        MONGODB_URI: 'mongodb://127.0.0.1:27017/social_media_app',
        JWT_SECRET: 'change_me_in_production'
      }
    },
    {
      name: 'socialmedia-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview -- --port 5173 --host',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
