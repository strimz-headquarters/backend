// function to generate expiration date (30 days from now)
function generateExpirationDate() {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expirationDate;
  }

  module.exports = generateExpirationDate;