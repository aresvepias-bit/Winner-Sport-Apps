module.exports = {
  apps: [
    {
      name: 'winner-backend',
      script: 'api/index.js',
      cwd: './backend',
      watch: false,
      env: {
        PORT: 5005,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'winner-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3005',
      cwd: './frontend',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
