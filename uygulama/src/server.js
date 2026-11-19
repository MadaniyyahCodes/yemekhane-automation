const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { oturumYukle } = require('./middleware/oturum');
const authRoutes = require('./routes/authRoutes');
const anasayfaRoutes = require('./routes/anasayfaRoutes');
const bakiyeRoutes = require('./routes/bakiyeRoutes');
const menuRoutes = require('./routes/menuRoutes');
const rezervasyonRoutes = require('./routes/rezervasyonRoutes');
const degerlendirmeRoutes = require('./routes/degerlendirmeRoutes');
const sistemRoutes = require('./routes/sistemRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false })); // reads HTML form data
app.use(cookieParser());
app.use(oturumYukle); // loads the Redis session on every request

app.use('/', authRoutes);
app.use('/', anasayfaRoutes);
app.use('/', bakiyeRoutes);
app.use('/', menuRoutes);
app.use('/', rezervasyonRoutes);
app.use('/', degerlendirmeRoutes);
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