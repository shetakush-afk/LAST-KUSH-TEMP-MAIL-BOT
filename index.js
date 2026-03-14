const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const BOT_TOKEN = process.env.BOT_TOKEN || "8665461427:AAGmvUTAvoV8Jw0iHlRL1eKC8T4u7Gwd0L0";
const OWNER_ID = 808562734;
const DOMAIN = "kushxmail.shop";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const users = new Set();
const bannedUsers = new Set();
const credits = {};
const emails = {};
const userEmails = {};
const keys = {};

function randomName() {
  return Math.random().toString(36).substring(2, 10);
}

function extractOTP(text) {
  const otp = text.match(/\b\d{4,8}\b/);
  return otp ? otp[0] : null;
}

app.get("/", (req, res) => {
  res.send("Kush Temp Mail Bot Running 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

bot.onText(/\/start/, (msg) => {

  const id = msg.chat.id;

  if (bannedUsers.has(id)) {
    bot.sendMessage(id, "❌ You are banned.");
    return;
  }

  users.add(id);

  if (!credits[id]) {
    credits[id] = 100;
  }

  if (id === OWNER_ID) {

    bot.sendMessage(id,
`👑 KUSH TEMP MAIL BOT

OWNER PANEL

/generate
/id
/credits

/genkey AMOUNT
/stats
/broadcast MESSAGE
/ban USERID
/unban USERID
`);

  } else {

    bot.sendMessage(id,
`✨ KUSH TEMP MAIL BOT

🎁 New User Bonus: 100 Credits

/generate - create email
/id - show emails
/credits - check credits
/redeem KEY

/help - support

👑 Owner: @KUSHxTRUSTED
🌐 Domain: @${DOMAIN}`);
  }

});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🆘 Need Help?

Contact Owner
👑 @KUSHxTRUSTED`);
});

bot.onText(/\/credits/, (msg) => {
  const id = msg.chat.id;
  bot.sendMessage(id, "💰 Credits: " + (credits[id] || 0));
});

bot.onText(/\/generate/, async (msg) => {

  const id = msg.chat.id;

  if ((credits[id] || 0) <= 0) {
    bot.sendMessage(id, "❌ No credits left");
    return;
  }

  const loading = await bot.sendMessage(id, "⏳ Generating email...");

  setTimeout(() => {

    const email = randomName() + "@" + DOMAIN;

    emails[email] = id;

    if (!userEmails[id]) {
      userEmails[id] = [];
    }

    userEmails[id].push(email);

    credits[id] -= 1;

    bot.editMessageText(
`📧 EMAIL CREATED

${email}

💰 Credits Left: ${credits[id]}`,
{
chat_id: id,
message_id: loading.message_id
});

  }, 1500);

});

bot.onText(/\/id/, (msg) => {

  const id = msg.chat.id;

  if (!userEmails[id] || userEmails[id].length === 0) {
    bot.sendMessage(id, "❌ No emails created.");
    return;
  }

  bot.sendMessage(id,
`📂 YOUR EMAILS

${userEmails[id].join("\n")}`);
});

bot.onText(/\/genkey (\d+)/, (msg, match) => {

  if (msg.chat.id !== OWNER_ID) return;

  const amount = parseInt(match[1]);

  const key = Math.random().toString(36).substring(2, 10);

  keys[key] = amount;

  bot.sendMessage(msg.chat.id,
`🔑 KEY CREATED

Key: ${key}
Credits: ${amount}`);
});

bot.onText(/\/redeem (.+)/, (msg, match) => {

  const id = msg.chat.id;
  const key = match[1];

  if (!keys[key]) {
    bot.sendMessage(id, "❌ Invalid key");
    return;
  }

  credits[id] += keys[key];
  delete keys[key];

  bot.sendMessage(id,
`✅ Key Redeemed

💰 Credits: ${credits[id]}`);
});

bot.onText(/\/stats/, (msg) => {

  if (msg.chat.id !== OWNER_ID) return;

  bot.sendMessage(msg.chat.id,
`📊 BOT STATS

Users: ${users.size}
Emails: ${Object.keys(emails).length}`);
});

bot.onText(/\/ban (\d+)/, (msg, match) => {

  if (msg.chat.id !== OWNER_ID) return;

  bannedUsers.add(parseInt(match[1]));

  bot.sendMessage(msg.chat.id, "🚫 User banned");
});

bot.onText(/\/unban (\d+)/, (msg, match) => {

  if (msg.chat.id !== OWNER_ID) return;

  bannedUsers.delete(parseInt(match[1]));

  bot.sendMessage(msg.chat.id, "✅ User unbanned");
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {

  if (msg.chat.id !== OWNER_ID) return;

  users.forEach(u => {
    bot.sendMessage(u, match[1]).catch(() => {});
  });

  bot.sendMessage(msg.chat.id, "📢 Broadcast sent");
});

app.post("/mail", (req, res) => {

  const { to, from, subject, text } = req.body;

  const userId = emails[to];

  if (!userId) {
    res.send("no user");
    return;
  }

  const otp = extractOTP(text || "");

  let message =
`📩 NEW MAIL RECEIVED

📧 To: ${to}
👤 From: ${from}
📝 Subject: ${subject}`;

  if (otp) {
    message += `

━━━━━━━━━━━━━━━
🔑 OTP CODE: ${otp}
━━━━━━━━━━━━━━━`;
  }

  bot.sendMessage(userId, message);

  res.send("ok");
});
