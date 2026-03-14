const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN = "8665461427:AAGmvUTAvoV8Jw0iHlRL1eKC8T4u7Gwd0L0";
const DOMAIN = "kushxmail.shop";

const bot = new TelegramBot(TOKEN, { polling: true });
bot.deleteWebHook();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

let emails = {};
let userEmails = {};

app.get("/", (req, res) => {
  res.send("KUSH TEMP MAIL BOT RUNNING 🚀");
});

// random email
function randomName() {
  return Math.random().toString(36).substring(2, 10);
}

// start
bot.onText(/\/start/, (msg) => {

  bot.sendMessage(
    msg.chat.id,
`✨ KUSH TEMP MAIL BOT

/generate - create email
/id - show emails

Domain: @${DOMAIN}`
  );

});

// generate email
bot.onText(/\/generate/, (msg) => {

  let email = randomName() + "@" + DOMAIN;

  emails[email] = msg.chat.id;

  if (!userEmails[msg.chat.id]) {
    userEmails[msg.chat.id] = [];
  }

  userEmails[msg.chat.id].push(email);

  bot.sendMessage(msg.chat.id, `✅ Email Created\n\n${email}`);

});

// show emails
bot.onText(/\/id/, (msg) => {

  let list = userEmails[msg.chat.id];

  if (!list || list.length === 0) {
    bot.sendMessage(msg.chat.id, "❌ No emails created");
    return;
  }

  bot.sendMessage(msg.chat.id, "📂 Your Emails\n\n" + list.join("\n"));

});

// receive mail
app.post("/mail", async (req, res) => {

  try {

    const { to, subject, text } = req.body;

    console.log("MAIL RECEIVED:", to);

    if (emails[to]) {

      let content = text || "";

      if (content.length > 4000) {
        content = content.substring(0, 4000) + "\n\n...message truncated";
      }

      await bot.sendMessage(
        emails[to],
`📩 New Mail

To: ${to}
Subject: ${subject || "No subject"}

${content}`
      );

    }

    res.send("ok");

  } catch (err) {

    console.log("MAIL ERROR:", err);
    res.send("error");

  }

});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});/id - show emails

Domain: @${DOMAIN}`
  );

});

// generate email
bot.onText(/\/generate/, (msg) => {

  let email = randomName() + "@" + DOMAIN;

  emails[email] = msg.chat.id;

  if (!userEmails[msg.chat.id]) {
    userEmails[msg.chat.id] = [];
  }

  userEmails[msg.chat.id].push(email);

  bot.sendMessage(msg.chat.id, `✅ Email Created\n\n${email}`);

});

// show emails
bot.onText(/\/id/, (msg) => {

  let list = userEmails[msg.chat.id];

  if (!list || list.length === 0) {
    bot.sendMessage(msg.chat.id, "❌ No emails created");
    return;
  }

  bot.sendMessage(msg.chat.id, "📂 Your Emails\n\n" + list.join("\n"));

});

// receive mail
app.post("/mail", async (req, res) => {

  try {

    const { to, subject, text } = req.body;

    if (emails[to]) {

      let content = text || "";

      // telegram message limit fix
      if (content.length > 4000) {
        content = content.substring(0, 4000) + "\n\n...message truncated";
      }

      await bot.sendMessage(
        emails[to],
`📩 New Mail

To: ${to}
Subject: ${subject || "No subject"}

${content}`
      );

    }

    res.send("ok");

  } catch (err) {

    console.log("MAIL ERROR:", err);
    res.send("error");

  }

});

// crash protection
process.on("uncaughtException", err => {
  console.log("ERROR:", err);
});

process.on("unhandledRejection", err => {
  console.log("REJECTION:", err);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
