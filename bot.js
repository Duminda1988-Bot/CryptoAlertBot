const axios = require('axios');
const nodemailer = require('nodemailer');

// Configuration
const RESISTANCE_LEVEL = 95000.00;
const COINDESK_API_URL = 'https://api.coindesk.com/v1/bpi/currentprice/BTC.json';

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  sender: 'onlineworkduminda@gmail.com',
  appPassword: process.env.GMAIL_APP_PASSWORD || 'YOUR_GMAIL_APP_PASSWORD',
  receiver: 'dumindasujeewaa@gmail.com'
};

async function fetchBTCPrice() {
  try {
    console.log('Fetching BTC price from CoinDesk API...');
    const response = await axios.get(COINDESK_API_URL);
    const price = parseFloat(response.data.bpi.USD.rate_float);
    console.log(`Current BTC Price: $${price.toFixed(2)}`);
    return price;
  } catch (error) {
    console.error('Error fetching BTC price:', error.message);
    throw error;
  }
}

async function sendEmailAlert(currentPrice) {
  try {
    console.log('Setting up email transporter...');
    const transporter = nodemailer.createTransport({
      service: EMAIL_CONFIG.service,
      auth: {
        user: EMAIL_CONFIG.sender,
        pass: EMAIL_CONFIG.appPassword
      }
    });

    const mailOptions = {
      from: EMAIL_CONFIG.sender,
      to: EMAIL_CONFIG.receiver,
      subject: `🚨 BTC Price Alert - Resistance Level Reached!`,
      text: `BTC has reached or exceeded the resistance level!\n\nCurrent Price: $${currentPrice.toFixed(2)}\nResistance Level: $${RESISTANCE_LEVEL.toFixed(2)}\n\nTime: ${new Date().toISOString()}`
    };

    console.log('Sending email alert...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Email alert sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('=== Crypto Alert Bot Started ===');
    console.log(`Resistance Level: $${RESISTANCE_LEVEL.toFixed(2)}`);
    
    const currentPrice = await fetchBTCPrice();
    
    if (currentPrice >= RESISTANCE_LEVEL) {
      console.log('⚠️ Price is at or above resistance level! Sending alert...');
      await sendEmailAlert(currentPrice);
    } else {
      console.log('Price is below resistance level. No alert needed.');
    }
    
    console.log('=== Bot execution completed ===');
  } catch (error) {
    console.error('Bot execution failed:', error.message);
    process.exit(1);
  }
}

main();
