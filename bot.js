const axios = require('axios');
const nodemailer = require('nodemailer');

const WATCHLIST = [
  "BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","SOLUSDT",
  "DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","MATICUSDT",
  "DOTUSDT","NEARUSDT","APTUSDT","ARBUSDT","OPUSDT",
  "SUIUSDT","SEIUSDT","INJUSDT","RNDRUSDT","FTMUSDT",
  "GALAUSDT","ICPUSDT","AAVEUSDT","SANDUSDT","MKRUSDT",
  "WLDUSDT","JUPUSDT","TIAUSDT","PEPEUSDT","FLOKIUSDT",
  "SHIBUSDT","BONKUSDT","WIFUSDT","ORDIUSDT","SATSUSDT",
  "LDOUSDT","ENSUSDT","IMXUSDT","STXUSDT","DYDXUSDT",
  "ALGOUSDT","ATOMUSDT","TRXUSDT","LTCUSDT","XLMUSDT",
  "BCHUSDT","ETCUSDT","HBARUSDT","PYTHUSDT",
  "FETUSDT","TONUSDT","TAOUSDT","ONDOUSDT","ENAUSDT","NOTUSDT"
];

const EMAIL_CONFIG = {
  service: 'gmail',
  sender: 'onlineworkduminda@gmail.com',
  appPassword: process.env.GMAIL_APP_PASSWORD,
  receiver: 'eg.dumindasujeewa@gmail.com'
};

async function fetchMarketData() {
  console.log('Fetching Binance Futures data...');
  const res = await axios.get(
    'https://fapi.binance.com/fapi/v1/ticker/24hr',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }
  );
  
  return res.data.filter(c => WATCHLIST.includes(c.symbol));
}

function scoreCoin(c) {
  let score = 0;
  const volume = Number(c.quoteVolume || 0);
  const change = Number(c.priceChangePercent || 0);
  const absChange = Math.abs(change);

  // Volume scoring
  if (volume > 200000000) score += 40;
  else if (volume > 100000000) score += 25;
  else if (volume > 50000000) score += 15;

  // Volatility scoring
  if (absChange > 8) score += 35;
  else if (absChange > 5) score += 25;
  else if (absChange > 3) score += 15;

  // Momentum bonus (change between 2-15%)
  if (change >= 2 && change <= 15) score += 10;

  return score;
}

async function sendAlert(signals) {
  const transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.sender,
      pass: EMAIL_CONFIG.appPassword
    }
  });

  let message = "🚨 TOP TRADE SIGNALS (FUTURES SCANNER)\n\n" +
                "====================================\n\n";

  signals.forEach((c, i) => {
    message +=
      `${i + 1}. 🪙 COIN: ${c.symbol}\n` +
      `   Score: ${c.score}/100\n` +
      `   Current Price: $${parseFloat(c.lastPrice).toFixed(4)}\n` +
      `   24h Change: ${c.priceChangePercent}%\n` +
      `   Volume: $${(parseFloat(c.quoteVolume) / 1000000).toFixed(2)}M\n\n`;
  });

  await transporter.sendMail({
    from: EMAIL_CONFIG.sender,
    to: EMAIL_CONFIG.receiver,
    subject: `🚀 [Futures Alert] Top ${signals.length} Signals - ${signals[0]?.symbol || 'N/A'}`,
    text: message
  });

  console.log("Email sent successfully");
}

async function main() {
  try {
    console.log("=== Futures Scanner Started ===");
    
    const market = await fetchMarketData();
    const signals = market
      .map(c => ({ ...c, score: scoreCoin(c) }))
      .filter(c => c.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Only alert if top signal has score >= 70
    if (signals.length > 0 && signals[0].score >= 70) {
      console.log("Top signals found:", signals.length);
      console.log("Top score:", signals[0].score);
      await sendAlert(signals);
    } else {
      console.log("No strong signals (score < 70 or no signals)");
    }
    
    console.log("=== Scanner Completed ===");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();