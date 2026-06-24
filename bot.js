const axios = require('axios');
const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  sender: 'onlineworkduminda@gmail.com',
  appPassword: process.env.GMAIL_APP_PASSWORD,
  receiver: 'eg.dumindasujeewa@gmail.com'
};

// Get Futures Market Data
async function fetchFuturesCoins() {
  try {
    console.log('Fetching Binance Futures data...');

    const response = await axios.get(
      'https://fapi.binance.com/fapi/v1/ticker/24hr'
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching futures data:', error.message);
    throw error;
  }
}

// Filter good candidate coins
function findCandidates(coins) {

  const filtered = coins
    .filter(c =>
      c.symbol.endsWith('USDT') &&
      parseFloat(c.quoteVolume) > 50000000 &&
      Math.abs(parseFloat(c.priceChangePercent)) > 3
    )
    .sort(
      (a, b) =>
        parseFloat(b.quoteVolume) -
        parseFloat(a.quoteVolume)
    )
    .slice(0, 10);

  return filtered;
}

// Send email
async function sendEmailAlert(candidates) {

  const transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.sender,
      pass: EMAIL_CONFIG.appPassword
    }
  });

  let message = '🚀 Futures Candidate Coins\n\n';

  candidates.forEach((coin, index) => {

    message +=
      `${index + 1}. ${coin.symbol}\n` +
      `24h Change: ${coin.priceChangePercent}%\n` +
      `Volume: ${Number(coin.quoteVolume).toFixed(0)}\n\n`;

  });

  const mailOptions = {
    from: EMAIL_CONFIG.sender,
    to: EMAIL_CONFIG.receiver,
    subject: '🚀 Futures Coin Scanner Alert',
    text: message
  };

  await transporter.sendMail(mailOptions);

  console.log('Email sent successfully');
}

async function main() {

  try {

    console.log('=== Futures Scanner Started ===');

    const coins = await fetchFuturesCoins();

    const candidates = findCandidates(coins);

    if (candidates.length === 0) {

      console.log('No candidates found');
      return;

    }

    console.log(
      `Found ${candidates.length} candidate coins`
    );

    await sendEmailAlert(candidates);

    console.log('=== Scanner Completed ===');

  } catch (error) {

    console.error(error.message);

  }

}

main();