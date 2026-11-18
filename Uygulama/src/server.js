const express = require('express');
const sistemRoutes = require('./routes/sistemRoutes');

const app = express();

app.use(express.urlencoded({ extended: false })); // reads HTML form data

app.get('/', (req, res) => {
  res.send('Yemekhane uygulaması çalışıyor');
});

app.use('/', sistemRoutes);

// Any error thrown inside a route ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Sunucu hatası');
});

app.listen(8000, '0.0.0.0', () => {
  console.log('Uygulama 8000 portunda dinliyor');
});

// Lets Ctrl+C and "docker compose stop" end the app quickly
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));