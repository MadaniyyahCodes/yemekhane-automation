const crypto = require('crypto');
const redis = require('../config/redis');

const SURE_SN = 30 * 60; // 30 minutes

const anahtar = (token) => `oturum:${token}`;

async function olustur(kullanici) {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(anahtar(token), JSON.stringify(kullanici), { EX: SURE_SN });
  return token;
}

// Reads the session and renews its 30 minutes in one step
async function getirVeYenile(token) {
  const veri = await redis.getEx(anahtar(token), { EX: SURE_SN });
  return veri ? JSON.parse(veri) : null;
}

async function sil(token) {
  await redis.del(anahtar(token));
}

module.exports = { olustur, getirVeYenile, sil };