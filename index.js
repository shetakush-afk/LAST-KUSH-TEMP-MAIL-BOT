const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN = "8564779220:AAGQrUv0wfDpFnYy6zljpyvjrdZ_n8AMk_A"; // BotFather token
const DOMAIN = "kushxmail.shop"; // your domain

const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
app.use(express.json());

let emails = {};
let userEmails = {};


// homepage
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
/delete email - delete email

Domain: @${DOMAIN}

Owner: @KUSHxTRUSTED
`;

  bot.sendMessage(msg.chat.id, text);
});


// generate email
bot.onText(/\/generate/, (msg) => {

  let name = randomName();
  let email = `${name}@${DOMAIN}`;

  emails[email] = msg.chat.id;

  if (!userEmails[msg.chat.id]) {
    userEmails[msg.chat.id] = [];
  }

  userEmails[msg.chat.id].push(email);

  bot.sendMessage(msg.chat.id, `✅ Email Generated\n\n${email}`);
});


// show emails
bot.onText(/\/id/, (msg) => {

  let list = userEmails[msg.chat.id];

  if (!list || list.length === 0) {
    bot.sendMessage(msg.chat.id, "❌ No emails created");
    return;
  }

  let text = "📂 Your Emails\n\n";

  list.forEach(e => {
    text += e + "\n";
  });

  bot.sendMessage(msg.chat.id, text);
});


// delete email
bot.onText(/\/delete (.+)/, (msg, match) => {

  let email = match[1];

  if (emails[email]) {

    delete emails[email];

    let arr = userEmails[msg.chat.id];
    userEmails[msg.chat.id] = arr.filter(e => e !== email);

    bot.sendMessage(msg.chat.id, "🗑 Email deleted");

  } else {

    bot.sendMessage(msg.chat.id, "❌ Email not found");

  }

});


// receive mail from cloudflare
app.post("/mail", (req, res) => {

  const { to, subject, text } = req.body;

  if (emails[to]) {

    bot.sendMessage(
      emails[to],
      `📩 New Mail\n\nTo: ${to}\n\nSubject: ${subject}\n\n${text}`
    );

  }

  res.send("ok");
});


// railway port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
