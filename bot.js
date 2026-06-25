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
const SCORE_THRESHOLD = 60;

const EMAIL_CONFIG = {
  service: 'gmail',
  sender: 'onlineworkduminda@gmail.com',
  appPassword: process.env.GMAIL_APP_PASSWORD,
  receiver: 'eg.dumindasujeewa@gmail.com'
};

async function fetchMarketData() {
  console.log('Fetching data from CoinGecko (Anti-block)...');
  // CoinGecko public API
  const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250');
  
  // CoinGecko දත්ත බයිනෑන්ස් ෆෝමැට් එකට හැඩගස්වමු
  return res.data.map(c => ({
    symbol: c.symbol.toUpperCase() + "USDT",
    lastPrice: c.current_price,
    highPrice: c.high_24h,
    lowPrice: c.low_24h,
    quoteVolume: c.total_volume,
    priceChangePercent: c.price_change_percentage_24h
  }));
}

function scoreCoin(c) {
  let score = 0;
  const volume = parseFloat(c.quoteVolume);
  const change = Math.abs(parseFloat(c.priceChangePercent));
  const currentPrice = parseFloat(c.lastPrice);
  const highPrice = parseFloat(c.highPrice);

  if (volume > 50000000) score += 20;
  if (change > 3) score += 20;
  
  const distanceToHigh = (highPrice - currentPrice) / currentPrice;
  if (distanceToHigh <= 0.015 && distanceToHigh >= 0) score += 40;

  return { score, isNearResistance: distanceToHigh <= 0.015 };
}

async function sendAlert(signals) {
  const transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: {
      user: EMAIL_CONFIG.sender,
      pass: EMAIL_CONFIG.appPassword
    }
  });

  let message = "🚨 TRADE CANDIDATE FOUND (24/7 SCANNER)\n\n" + 
                "පහත කාසි විශ්ලේෂණය කර Trade එකක් සඳහා සූදානම් වන්න:\n\n" +
                "====================================\n\n";

  signals.forEach((c, i) => {
    const statusTag = c.isNearResistance ? "⚠️ NEAR RESISTANCE (24h High) ⚠️" : "🔥 HIGH MOMENTUM";
    
    message +=
      `${i + 1}. 🪙 COIN: ${c.symbol}\n` +
      `   Status: ${statusTag}\n` +
      `   Score: ${c.score}/100\n` +
      `   Current Price: $${parseFloat(c.lastPrice).toFixed(4)}\n` +
      `   24h High (Resistance): $${parseFloat(c.highPrice).toFixed(4)}\n` +
      `   24h Change: ${c.priceChangePercent}%\n\n`;
  });

  await transporter.sendMail({
    from: EMAIL_CONFIG.sender,
    to: EMAIL_CONFIG.receiver,
    subject: `🚀 [Scanner Alert] ${signals[0].symbol} & More Candidates Found`,
    text: message
  });

  console.log("Email sent successfully");
}

async function main() {
  try {
    const market = await fetchMarketData();
    const signals = market
      .filter(c => WATCHLIST.includes(c.symbol))
      .map(c => ({ ...c, ...scoreCoin(c) }))
      .filter(c => c.score >= SCORE_THRESHOLD);

    if (signals.length > 0) {
      console.log("Signals found:", signals.length);
      await sendAlert(signals);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();