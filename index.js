const TelegramBot = require("node-telegram-bot-api")
const express = require("express")
const fs = require("fs")

const BOT_TOKEN = process.env.BOT_TOKEN
const OWNER_ID = Number(process.env.OWNER_ID)
const DOMAIN = "kushxmail.shop"

const bot = new TelegramBot(BOT_TOKEN,{polling:true})

const app = express()
app.use(express.json())

let db = {}

if(fs.existsSync("db.json")){
 db = JSON.parse(fs.readFileSync("db.json"))
}

function saveDB(){
 fs.writeFileSync("db.json",JSON.stringify(db,null,2))
}

function getUser(id){

 if(!db[id]){
  db[id] = {
   credits:100,
   mails:[]
  }
 }

 return db[id]
}

function randomMail(){

 const str = Math.random().toString(36).substring(2,9)

 return `${str}@${DOMAIN}`

}

function mailTaken(mail){

 for(const u in db){

  if(db[u].mails.includes(mail)){
   return true
  }

 }

 return false
}

/* START */

bot.onText(/\/start/,msg=>{

 const id = msg.from.id
 const name = msg.from.first_name
 const user = getUser(id)

 bot.sendMessage(id,

`╔══════════════════════╗
      ✉️ KUSHX MAIL BOT
╚══════════════════════╝

👤 User : ${name}
🆔 ID : ${id}

━━━━━━━━━━━━━━━━━

📧 Emails Created : ${user.mails.length}
💳 Credits : ${user.credits}

⚡ Generate temporary emails instantly
━━━━━━━━━━━━━━━━━`)

})

/* GENERATE */

bot.onText(/\/generate/,msg=>{

 const id = msg.from.id
 const user = getUser(id)

 if(id !== OWNER_ID && user.credits <= 0){
  bot.sendMessage(id,"❌ No credits left")
  return
 }

 if(id !== OWNER_ID){
  user.credits -= 1
 }

 let mail = randomMail()

 while(mailTaken(mail)){
  mail = randomMail()
 }

 user.mails.push(mail)

 saveDB()

 bot.sendMessage(id,

`📧 EMAIL GENERATED

${mail}

💳 Credits Left : ${user.credits}`)

})

/* CREDIT */

bot.onText(/\/credit/,msg=>{

 const user = getUser(msg.from.id)

 bot.sendMessage(msg.chat.id,

`💳 YOUR CREDITS

Credits : ${user.credits}`)

})

/* MAIL HISTORY */

bot.onText(/\/id/,msg=>{

 const id = msg.from.id
 const user = getUser(id)

 if(user.mails.length === 0){
  bot.sendMessage(id,"📭 No emails")
  return
 }

 user.mails.forEach(mail=>{

  bot.sendMessage(id,

`📧 ${mail}`,

{
reply_markup:{
inline_keyboard:[
[
{ text:"🗑 Delete", callback_data:`del_${mail}`}
]
]
}
})

 })

})

/* DELETE MAIL */

bot.on("callback_query",q=>{

 const id = q.message.chat.id
 const data = q.data

 if(data.startsWith("del_")){

  const mail = data.split("_")[1]

  const user = getUser(id)

  user.mails = user.mails.filter(m=>m!==mail)

  saveDB()

  bot.sendMessage(id,"🗑 Email Deleted")

 }

})

/* PREMIUM */

bot.onText(/\/premium/,msg=>{

 bot.sendMessage(msg.chat.id,

`💎 PREMIUM ACCESS

Contact Owner

@KUSHxTRUSTED`)

})

/* BUY */

bot.onText(/\/buy/,msg=>{

 bot.sendMessage(msg.chat.id,

`💰 BUY CREDITS

100 Credits = ₹10

UPI ID

kush@upi

Send payment screenshot to

@KUSHxTRUSTED`)

})

/* ADMIN PANEL */

bot.onText(/\/panel/,msg=>{

 if(msg.from.id !== OWNER_ID) return

 const users = Object.keys(db).length

 let mails = 0

 for(const u in db){
  mails += db[u].mails.length
 }

 bot.sendMessage(msg.chat.id,

`📊 LIVE BOT STATS

👥 Users : ${users}
📧 Emails : ${mails}`)

})

/* EMAIL WEBHOOK */

app.post("/email",(req,res)=>{

 const {to,subject,text} = req.body

 if(!subject) return res.send("ok")

 const spamWords=["casino","lottery","win money"]

 if(spamWords.some(w=>subject.toLowerCase().includes(w))){
  return res.send("spam")
 }

 for(const u in db){

  if(db[u].mails.includes(to)){

   bot.sendMessage(u,

`📩 NEW EMAIL

📧 To : ${to}

📝 Subject :
${subject}

💬 Message :

${text}`)

  }

 }

 res.send("ok")

})

app.get("/",(req,res)=>{
 res.send("Temp Mail Bot Running")
})

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
 console.log("Server Running")
})