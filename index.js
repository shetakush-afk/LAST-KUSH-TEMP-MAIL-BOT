const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const BOT_TOKEN = process.env.BOT_TOKEN || "8665461427:AAGmvUTAvoV8Jw0iHlRL1eKC8T4u7Gwd0L0";
const OWNER_ID = 808562734;
const DOMAIN = "kushxmail.shop";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.setMyCommands([
{ command: "generate", description: "📧 Generate Email" },
{ command: "id", description: "📂 Your Emails" },
{ command: "credits", description: "💰 Check Credits" },
{ command: "redeem", description: "🔑 Redeem Key" },
{ command: "help", description: "🆘 Support" }
]);

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

  if (!(id in credits)) {

    credits[id] = 100;

    bot.sendMessage(id,
`🎁 <b>Welcome Bonus</b>

You received <b>100 Credits</b> for joining!

Use /generate to create email.`,
{ parse_mode: "HTML" });

  }

  bot.sendMessage(id,
`<b>✨ KUSH TEMP MAIL BOT</b>

━━━━━━━━━━━━━━━━
📧 Instant Temporary Email
⚡ Fast OTP Detection
━━━━━━━━━━━━━━━━

💰 <b>Your Credits:</b> ${credits[id]}

Commands:
/generate
/id
/credits
/redeem
/help

🌐 Domain: ${DOMAIN}
`,
{ parse_mode: "HTML" });

});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🆘 Need Help?

Contact Owner
👑 @KUSHxTRUSTED`);
});

bot.onText(/\/credits/, (msg) => {
  const id = msg.chat.id;

  bot.sendMessage(id,
`<b>💰 YOUR CREDITS</b>

━━━━━━━━━━━━━━━━
Balance: <b>${credits[id] || 0}</b>
━━━━━━━━━━━━━━━━`,
{ parse_mode: "HTML" });
});

bot.onText(/\/generate/, async (msg) => {

  const id = msg.chat.id;

  if ((credits[id] || 0) <= 0) {
    bot.sendMessage(id, "❌ No credits left");
    return;
  }

  const loading = await bot.sendMessage(id, "⚡ Generating email.");

  let dots = 1;

  const animation = setInterval(() => {

    dots++;
    if (dots > 3) dots = 1;

    bot.editMessageText(
      "⚡ Generating email" + ".".repeat(dots),
      {
        chat_id: id,
        message_id: loading.message_id
      }
    );

  }, 500);

  setTimeout(() => {

    clearInterval(animation);

    const email = randomName() + "@" + DOMAIN;

    emails[email] = id;

    if (!userEmails[id]) {
      userEmails[id] = [];
    }

    userEmails[id].push(email);

    credits[id] -= 1;

    bot.editMessageText(
`<b>✅ EMAIL GENERATED</b>

━━━━━━━━━━━━━━━━
📧 <b>Your Email</b>

<code>${email}</code>

📋 Tap email to copy
━━━━━━━━━━━━━━━━

💰 <b>Credits Left:</b> ${credits[id]}

📥 Waiting for incoming mail...
`,
{
chat_id: id,
message_id: loading.message_id,
parse_mode: "HTML"
});

  }, 3000);

});

bot.onText(/\/id/, (msg) => {

  const id = msg.chat.id;

  if (!userEmails[id] || userEmails[id].length === 0) {
    bot.sendMessage(id, "❌ No emails created.");
    return;
  }

  const list = userEmails[id].map(e => `<code>${e}</code>`).join("\n");

  bot.sendMessage(id,
`<b>📂 YOUR EMAILS</b>

Tap email to copy

${list}`,
{ parse_mode: "HTML" });

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

app.post("/mail", (req, res) => {

  const { to, from, subject, text, html } = req.body;

  const userId = emails[to];

  if (!userId) {
    res.send("no user");
    return;
  }

  const otp = extractOTP(text || "");

  let message =
`<b>📩 NEW EMAIL RECEIVED</b>

━━━━━━━━━━━━━━━━
📧 <b>Email:</b> <code>${to}</code>
👤 <b>From:</b> ${from}
📝 <b>Subject:</b> ${subject}
━━━━━━━━━━━━━━━━
`;

  if (otp) {
    message += `

🔐 <b>OTP CODE</b>

<code>${otp}</code>

`;
  }

  if (html) {
    message += html;
  } else if (text) {
    message += `<pre>${text}</pre>`;
  }

  bot.sendMessage(userId, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true
  });

  res.send("ok");

});});

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
