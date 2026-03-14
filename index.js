const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN = "8665461427:AAGmvUTAvoV8Jw0iHlRL1eKC8T4u7Gwd0L0";
const DOMAIN = "kushxmail.shop";

const bot = new TelegramBot(TOKEN, { polling: true });

// fix telegram conflict
bot.deleteWebHook();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

let emails = {};
let userEmails = {};

app.get("/", (req, res) => {
  res.send("KUSH TEMP MAIL BOT RUNNING 🚀");
});

// random email generator
function randomName() {
  return Math.random().toString(36).substring(2, 10);
}

// start command
bot.onText(/\/start/, (msg) => {

  const text = `
✨ KUSH TEMP MAIL BOT ✨

Commands:

/generate - create temp email
/id - show your emails

Domain: @${DOMAIN}
`;

  bot.sendMessage(msg.chat.id, text);

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

// receive mail webhook
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

    console.log(err);
    res.send("error");

  }

});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
