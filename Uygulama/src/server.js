const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Yemekhane uygulaması çalışıyor');
});

app.listen(8000, '0.0.0.0', () => {
  console.log('Uygulama 8000 portunda dinliyor');
});

// Lets Ctrl+C and "docker compose stop" end the app quickly
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));