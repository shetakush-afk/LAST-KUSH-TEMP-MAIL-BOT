const TelegramBot = require("node-telegram-bot-api")
const express = require("express")

const BOT_TOKEN = "8665461427:AAGmvUTAvoV8Jw0iHlRL1eKC8T4u7Gwd0L0"
const OWNER_ID = 808562734
const DOMAIN = "kushxmail.shop"

const bot = new TelegramBot(BOT_TOKEN, { polling: true })

const app = express()
app.use(express.json())

const users = new Set()
const bannedUsers = new Set()
const credits = {}
const emails = {}
const userEmails = {}
const keys = {}

function randomName() {
  return Math.random().toString(36).substring(2,10)
}

function extractOTP(text) {
  const otp = text.match(/\b\d{4,8}\b/)
  return otp ? otp[0] : null
}

app.get("/", (req,res)=>{
  res.send("Kush Temp Mail Bot Running")
})

app.listen(8080,()=>{
  console.log("Server running on port 8080")
})

bot.onText(/\/start/, (msg)=>{

  const id = msg.chat.id

  if(bannedUsers.has(id)){
    bot.sendMessage(id,"❌ You are banned.")
    return
  }

  users.add(id)

  if(!credits[id]){
    credits[id] = 100
  }

  if(id == OWNER_ID){

bot.sendMessage(id,`
👑══════════════════════👑
     KUSH TEMP MAIL BOT
👑══════════════════════👑

🔥 OWNER PANEL

/generate
/id
/credits

/genkey AMOUNT
/stats
/broadcast MESSAGE
/ban USERID
/unban USERID
`)

  } else {

bot.sendMessage(id,`
✨══════════════════════✨
     KUSH TEMP MAIL BOT
✨══════════════════════✨

🎁 New User Bonus: 100 Credits

⚡ /generate
Create temporary email

📂 /id
Show your emails

💰 /credits
Check credits

🔑 /redeem KEY

🆘 /help

👑 Owner: @KUSHxTRUSTED
🌐 Domain: @${DOMAIN}
`)

  }

})

bot.onText(/\/help/, (msg)=>{
bot.sendMessage(msg.chat.id,
`🆘 Support

Contact Owner
👑 @KUSHxTRUSTED`)
})

bot.onText(/\/credits/, (msg)=>{
const id = msg.chat.id
bot.sendMessage(id,`💰 Credits: ${credits[id] || 0}`)
})

bot.onText(/\/generate/, async (msg)=>{

const id = msg.chat.id

if(credits[id] <= 0){
  bot.sendMessage(id,"❌ No credits left")
  return
}

const loading = await bot.sendMessage(id,"⏳ Generating email...")

setTimeout(()=>{

let email = randomName()+"@"+DOMAIN

emails[email] = id

if(!userEmails[id]){
  userEmails[id] = []
}

userEmails[id].push(email)

credits[id] -= 1

bot.editMessageText(
`📧 EMAIL CREATED

${email}

💰 Credits Left: ${credits[id]}`,
{
chat_id:id,
message_id:loading.message_id
})

},1500)

})

bot.onText(/\/id/, (msg)=>{

const id = msg.chat.id

if(!userEmails[id] || userEmails[id].length==0){
  bot.sendMessage(id,"❌ No emails")
  return
}

bot.sendMessage(id,
`📂 YOUR EMAILS

${userEmails[id].join("\n")}`)
})

bot.onText(/\/genkey (.+)/,(msg,match)=>{

if(msg.chat.id != OWNER_ID) return

const amount = parseInt(match[1])

const key = Math.random().toString(36).substring(2,10)

keys[key] = amount

bot.sendMessage(msg.chat.id,
`🔑 KEY CREATED

Key: ${key}
Credits: ${amount}`)
})

bot.onText(/\/redeem (.+)/,(msg,match)=>{

const id = msg.chat.id
const key = match[1]

if(!keys[key]){
  bot.sendMessage(id,"❌ Invalid key")
  return
}

credits[id] += keys[key]

delete keys[key]

bot.sendMessage(id,
`✅ Key Redeemed

💰 New Credits: ${credits[id]}`)
})

bot.onText(/\/stats/, (msg)=>{

if(msg.chat.id != OWNER_ID) return

bot.sendMessage(msg.chat.id,
`📊 BOT STATS

Users: ${users.size}
Emails: ${Object.keys(emails).length}`)
})

bot.onText(/\/ban (.+)/,(msg,match)=>{

if(msg.chat.id != OWNER_ID) return

bannedUsers.add(parseInt(match[1]))

bot.sendMessage(msg.chat.id,"🚫 User banned")
})

bot.onText(/\/unban (.+)/,(msg,match)=>{

if(msg.chat.id != OWNER_ID) return

bannedUsers.delete(parseInt(match[1]))

bot.sendMessage(msg.chat.id,"✅ User unbanned")
})

bot.onText(/\/broadcast (.+)/,(msg,match)=>{

if(msg.chat.id != OWNER_ID) return

users.forEach(u=>{
bot.sendMessage(u,match[1]).catch(()=>{})
})

bot.sendMessage(msg.chat.id,"📢 Broadcast sent")
})

app.post("/mail",(req,res)=>{

const {to,from,subject,text} = req.body

const userId = emails[to]

if(!userId){
res.send("no user")
return
}

const otp = extractOTP(text || "")

let message = `
📩 NEW MAIL RECEIVED

📧 To: ${to}
👤 From: ${from}
📝 Subject: ${subject}
`

if(otp){
message += `

━━━━━━━━━━━━━━━
🔑 OTP CODE: ${otp}
━━━━━━━━━━━━━━━
`
}

bot.sendMessage(userId,message)

res.send("ok")

})/generate - create temp email
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
