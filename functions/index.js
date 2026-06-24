const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const nodemailer = require("nodemailer");

// 🚨 Gmail Configuration
const SENDER_EMAIL = "onlineworkduminda@gmail.com"; 
// 💡 අවධානයට: මෙතනට ඔයාගේ සාමාන්‍ය Gmail Password එක නෙවෙයි දෙන්න ඕනේ. 
// Google Account එකෙන් ගන්න "App Password" එකක්. ඒක ගන්න හැටි මම පල්ලෙහා කියන්නම්.
const SENDER_APP_PASSWORD = "YOUR_GMAIL_APP_PASSWORD"; 

const RECEIVER_EMAIL = "eg.dumindasujeewa@gmail.com"; // Alert එක ලැබෙන්න ඕනෙත් ඔයාගේම මේ මේල් එකටමයි.

// 🚨 Coin සහ Target Level එක
const TARGET_COIN = "BTCUSDT"; 
const RESISTANCE_LEVEL = 95000.00; 

// හැම විනාඩි 15කට සැරයක් Auto Run වෙනවා
exports.cryptoPriceChecker = onSchedule("every 15 minutes", async (event) => {
    try {
        // 1. Binance Live Price එක ගන්නවා
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${TARGET_COIN}`);
        const currentPrice = parseFloat(response.data.price);
        
        logger.info(`${TARGET_COIN} Live Price: $${currentPrice}`);

        // 2. මිල සීමාව පැනලාද බලනවා
        if (currentPrice >= RESISTANCE_LEVEL) {
            const emailSubject = `🚨 CRYPTO ALERT: ${TARGET_COIN} Breakout!`;
            const emailText = `හිතවත් දුමින්ද,\n\nඔබ බලාපොරොත්තු වූ මිල සීමාව පසුකර ඇත!\n\n🪙 Coin: ${TARGET_COIN}\n📈 වත්මන් මිල: $${currentPrice}\n🎯 Target Level: $${RESISTANCE_LEVEL}\n\nCrypto Bot`;
            
            // Gmail එකට Alert එක යවනවා
            await sendEmailAlert(emailSubject, emailText);
        }

    } catch (error) {
        logger.error("Error occurred:", error);
    }
});

// ඊමේල් එකක් යවන Function එක
async function sendEmailAlert(subject, text) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_APP_PASSWORD,
        },
    });

    let mailOptions = {
        from: SENDER_EMAIL,
        to: RECEIVER_EMAIL,
        subject: subject,
        text: text,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info("Alert Email sent successfully!");
    } catch (error) {
        logger.error("Failed to send email:", error);
    }
}