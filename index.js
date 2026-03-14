const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN = "8564779220:AAGQrUv0wfDpFnYy6zljpyvjrdZ_n8AMk_A";
const DOMAIN = "kushxmail.shop";

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(express.json());

let emails = {};
let userEmails = {};

function randomName() {
    return Math.random().toString(36).substring(2,10);
}

// START
bot.onText(/\/start/, (msg) => {

let text = `
✨━━━━━━━━━━━━━━✨
🚀 KUSH TEMP MAIL BOT
✨━━━━━━━━━━━━━━✨

📧 Create temporary emails instantly!

📜 Commands

⚡ /generate
Create new email

📂 /id
See your emails

🗑 /delete email
Delete email

━━━━━━━━━━━━━━

📩 How it works

1️⃣ Generate email  
2️⃣ Use anywhere  
3️⃣ Mail arrives  
4️⃣ Bot sends here 📬

🌐 Domain
@${DOMAIN}

👑 Owner
@KUSHxTRUSTED
`;

bot.sendMessage(msg.chat.id, text);

});

// GENERATE
bot.onText(/\/generate/, (msg) => {

let name = randomName();
let email = `${name}@${DOMAIN}`;

emails[email] = msg.chat.id;

if(!userEmails[msg.chat.id]){
userEmails[msg.chat.id] = [];
}

userEmails[msg.chat.id].push(email);

bot.sendMessage(msg.chat.id,`✅ Email Generated

${email}

Send mail to this address 📬`);
});

// LIST EMAILS
bot.onText(/\/id/, (msg) => {

let list = userEmails[msg.chat.id];

if(!list){
bot.sendMessage(msg.chat.id,"❌ No emails created");
return;
}

let text = "📂 Your Emails\n\n";

list.forEach(e=>{
text += e + "\n";
});

bot.sendMessage(msg.chat.id,text);

});

// DELETE
bot.onText(/\/delete (.+)/,(msg,match)=>{

let email = match[1];

if(emails[email]){

delete emails[email];

let arr = userEmails[msg.chat.id];
userEmails[msg.chat.id] = arr.filter(e=>e!==email);

bot.sendMessage(msg.chat.id,"🗑 Email deleted");

}else{

bot.sendMessage(msg.chat.id,"❌ Email not found");

}

});

// MAIL API
app.post("/mail",(req,res)=>{

let {to,subject,text} = req.body;

if(emails[to]){

bot.sendMessage(emails[to],`📩 New Mail

To: ${to}

Subject: ${subject}

${text}`);
}

res.send("ok");

});

app.listen(3000,()=>{
console.log("Server running");
});
