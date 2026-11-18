const { createClient } = require('redis');

const istemci = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

istemci.on('error', (err) => console.error('Redis hatası:', err.message));
istemci.connect().catch((err) => console.error('Redis bağlantısı kurulamadı:', err.message));

module.exports = istemci;