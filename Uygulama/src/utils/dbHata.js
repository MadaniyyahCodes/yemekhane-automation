// Procedures signal business errors with SQLSTATE 45000 (MySQL error code 1644).
// Returns the Turkish message for those, or null for any other kind of error.
function kullaniciMesaji(err) {
  if (err && err.errno === 1644 && err.sqlState === '45000') return err.sqlMessage;
  return null;
}

module.exports = { kullaniciMesaji };