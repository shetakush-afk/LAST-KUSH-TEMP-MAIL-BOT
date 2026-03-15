const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN missing");
  process.exit(1);
}

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

function randomName() {
  return Math.random().toString(36).substring(2, 10);
}

function extractOTP(text) {
  const otp = text.match(/\b\d{4,8}\b/);
  return otp ? otp[0] : null;
}

app.get("/", (req, res) => {
  res.send("Temp Mail Bot Running 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

bot.setMyCommands([
  { command: "generate", description: "📧 Generate Email" },
  { command: "id", description: "📂 Your Emails" },
  { command: "credits", description: "💰 Check Credits" },
  { command: "help", description: "🆘 Support" }
]);

bot.onText(/\/start/, (msg) => {

  const id = msg.chat.id;

  if (bannedUsers.has(id)) {
    bot.sendMessage(id, "❌ You are banned.");
    return;
  }

  users.add(id);

  if (!(id in credits)) {
    credits[id] = 100;

    bot.sendMessage(id,
`🎁 Welcome Bonus

You received 100 credits!

Use /generate to create email.`);
  }

  bot.sendMessage(id,
`✨ KUSH TEMP MAIL BOT

📧 Instant Temporary Email
⚡ Fast OTP Detection

💰 Credits: ${credits[id]}

Commands:
/generate
/id
/credits
/help

Domain: ${DOMAIN}`);
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

  const loading = await bot.sendMessage(id, "⚡ Generating email.");

  setTimeout(() => {

    const email = randomName() + "@" + DOMAIN;

    emails[email] = id;

    if (!userEmails[id]) {
      userEmails[id] = [];
    }

    userEmails[id].push(email);

    credits[id] -= 1;

    bot.editMessageText(
`✅ EMAIL GENERATED

Your Email:

${email}

Tap email to copy

Credits Left: ${credits[id]}`,
{
chat_id: id,
message_id: loading.message_id
});

  }, 2000);

});

bot.onText(/\/id/, (msg) => {

  const id = msg.chat.id;

  if (!userEmails[id] || userEmails[id].length === 0) {
    bot.sendMessage(id, "❌ No emails created.");
    return;
  }

  const list = userEmails[id].join("\n");

  bot.sendMessage(id,
`📂 YOUR EMAILS

${list}`);
});

bot.onText(/\/help/, (msg) => {

  bot.sendMessage(msg.chat.id,
`🆘 Need Help?

Contact Owner
@KUSHxTRUSTED`);
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
`📩 NEW EMAIL RECEIVED

To: ${to}
From: ${from}
Subject: ${subject}
`;

  if (otp) {
    message += `

OTP CODE

${otp}`;
  }

  if (text) {
    message += `

${text}`;
  }

  bot.sendMessage(userId, message);

  res.send("ok");

});
