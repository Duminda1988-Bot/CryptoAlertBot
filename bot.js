const axios = require('axios');
const nodemailer = require('nodemailer');

// =====================
// CONFIG
// =====================

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
  "BCHUSDT","ETCUSDT","HBARUSDT","PYTHUSDT"
];

// අපි ශ්‍රෙෂ්ඨත්වය (Threshold) 60 දක්වා ලිහිල් කරනවා දිනපතා සිග්නල් ගන්න
const SCORE_THRESHOLD = 60;

// Email config
const EMAIL_CONFIG = {
  service: 'gmail',
  sender: 'onlineworkduminda@gmail.com',
  appPassword: process.env.GMAIL_APP_PASSWORD,
  receiver: 'eg.dumindasujeewa@gmail.com'
};

// =====================
// FETCH DATA
// =====================
async function fetchMarketData() {
  console.log('Fetching Binance data from Spot API (Anti-block)...');
  const res = await axios.get(
    'https://api.binance.com/api/v3/ticker/24hr',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }
  );

  return res.data.filter(c => WATCHLIST.includes(c.symbol));
}

// =====================
// SCORING ENGINE (UPDATED FOR RESISTANCE DETECTION)
// =====================
function scoreCoin(c) {
  let score = 0;

  const volume = parseFloat(c.quoteVolume);
  const change = parseFloat(c.priceChangePercent);
  const currentPrice = parseFloat(c.lastPrice);
  const highPrice = parseFloat(c.highPrice);

  // 1. Volume Score
  if (volume > 100000000) score += 20;
  else if (volume > 50000000) score += 10;

  // 2. Volatility Score
  const absChange = Math.abs(change);
  if (absChange > 5) score += 20;
  else if (absChange > 3) score += 10;

  // 3. Liquidity Safety
  if (c.symbol.endsWith("USDT")) score += 10;

  // 4. CRITICAL BREAKOUT / RESISTANCE LOGIC (සුපිරිම කෑල්ල)
  // දැන් මිල පැය 24ක උපරිම මිලට වඩා 1.5%ක් හෝ ඊට වඩා කිට්ටු නම් (Resistance Area)
  const distanceToHigh = (highPrice - currentPrice) / currentPrice;
  if (distanceToHigh <= 0.015 && distanceToHigh >= 0) {
    score += 40; // රෙසිස්ටන්ස් එක ළඟ නිසා කෙළින්ම ලකුණු 40ක බෝනස් එකක්!
  }

  return { score, isNearResistance: distanceToHigh <= 0.015 };
}

// =====================
// FIND SIGNALS
// =====================
function findSignals(coins) {
  return coins
    .map(c => {
      const analysis = scoreCoin(c);
      return {
        symbol: c.symbol,
        priceChangePercent: c.priceChangePercent,
        quoteVolume: c.quoteVolume,
        lastPrice: c.lastPrice,
        highPrice: c.highPrice,
        score: analysis.score,
        isNearResistance: analysis.isNearResistance
      };
    })
    .filter(c => c.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

// =====================
// EMAIL ALERT
// =====================
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

// =====================
// MAIN
// =====================
async function main() {
  try {
    console.log("=== WATCHLIST SCANNER STARTED ===");

    const market = await fetchMarketData();
    const signals = findSignals(market);

    if (signals.length === 0) {
      console.log("No strong momentum or resistance setups found right now.");
      return;
    }

    console.log("Signals found:", signals.length);
    await sendAlert(signals);
    console.log("=== DONE ===");

  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();