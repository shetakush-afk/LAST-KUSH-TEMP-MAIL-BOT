const TelegramBot = require("node-telegram-bot-api")
const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")

const BOT_TOKEN = process.env.BOT_TOKEN
const OWNER_ID = Number(process.env.OWNER_ID)
const DOMAIN = "kushxmail.store"

const bot = new TelegramBot(BOT_TOKEN,{polling:true})

const app = express()
app.use(bodyParser.json())

let db = {}

if(fs.existsSync("db.json")){
 db = JSON.parse(fs.readFileSync("db.json"))
}

function saveDB(){
 fs.writeFileSync("db.json",JSON.stringify(db,null,2))
}

function addLog(text){

 if(!db.logs){
  db.logs=[]
 }

 db.logs.push({
  text:text,
  time:Date.now()
 })

 if(db.logs.length>100){
  db.logs.shift()
 }

 saveDB()
}

function getUser(id){

 if(!db[id]){
  db[id]={
   credits:100,
   mails:[],
   admin:false,
   banned:false
  }

  addLog(`👤 New user joined ${id}`)
 }

 if(id==OWNER_ID){
  db[id].admin=true
 }

 return db[id]
}

function randomMail(){
 const str=Math.random().toString(36).substring(2,8)
 return `${str}@${DOMAIN}`
}

function mailTaken(mail){

 for(const u in db){
  if(db[u].mails && db[u].mails.includes(mail)){
   return true
  }
 }

 return false
}

bot.onText(/\/start/,msg=>{

 const id=msg.from.id
 const user=getUser(id)

 if(user.banned){
  bot.sendMessage(id,"🚫 You are banned")
  return
 }

 bot.sendMessage(id,

`🚀 KUSH TEMP MAIL

👤 ID: ${id}
💳 Credits: ${user.credits}
📧 Emails: ${user.mails.length}

Commands

/generate
/credit
/id
/transfer
/delete
/search
/backup

👑 Owner
@KUSHxTRUSTED`)
})

bot.onText(/\/generate/,msg=>{

 const id=msg.from.id
 const user=getUser(id)

 if(user.banned) return

 if(id!==OWNER_ID && user.credits<=0){
  bot.sendMessage(id,"❌ No credits")
  return
 }

 if(id!==OWNER_ID){
  user.credits-=1
 }

 let mail=randomMail()

 while(mailTaken(mail)){
  mail=randomMail()
 }

 user.mails.push(mail)

 saveDB()

 addLog(`📧 ${id} generated ${mail}`)

 bot.sendMessage(id,`📧 Email Created

${mail}

💳 Credits left ${user.credits}`)
})

bot.onText(/\/credit/,msg=>{

 const user=getUser(msg.from.id)

 bot.sendMessage(msg.chat.id,
`💳 Credits

${user.credits}`)
})

bot.onText(/\/id/,msg=>{

 const user=getUser(msg.from.id)

 if(user.mails.length===0){
  bot.sendMessage(msg.chat.id,"📭 No emails")
  return
 }

 bot.sendMessage(msg.chat.id,
`📜 Your Emails

${user.mails.join("\n")}`)
})

bot.onText(/\/delete (.+)/,(msg,match)=>{

 const mail=match[1]
 const user=getUser(msg.from.id)

 if(!user.mails.includes(mail)){
  bot.sendMessage(msg.chat.id,"❌ Not found")
  return
 }

 user.mails=user.mails.filter(m=>m!==mail)

 saveDB()

 addLog(`🗑 ${msg.from.id} deleted ${mail}`)

 bot.sendMessage(msg.chat.id,"✅ Deleted")
})

bot.onText(/\/transfer (.+) (.+)/,(msg,match)=>{

 const from=msg.from.id
 const mail=match[1]
 const to=match[2]

 const user=getUser(from)

 if(!user.mails.includes(mail)){
  bot.sendMessage(from,"❌ Not yours")
  return
 }

 user.mails=user.mails.filter(m=>m!==mail)

 const target=getUser(to)

 target.mails.push(mail)

 if(!db.transfers){
  db.transfers=[]
 }

 db.transfers.push({
  from:from,
  to:to,
  email:mail
 })

 saveDB()

 addLog(`🔄 ${from} transferred ${mail} to ${to}`)

 bot.sendMessage(from,"✅ Transferred")
})

bot.onText(/\/ban (.+)/,(msg,match)=>{

 if(msg.from.id!==OWNER_ID) return

 const uid=match[1]

 const user=getUser(uid)

 user.banned=true

 saveDB()

 bot.sendMessage(uid,"🚫 You are banned")

})

bot.onText(/\/unban (.+)/,(msg,match)=>{

 if(msg.from.id!==OWNER_ID) return

 const uid=match[1]

 const user=getUser(uid)

 user.banned=false

 saveDB()

 bot.sendMessage(uid,"✅ You are unbanned")

})

bot.onText(/\/logs/,msg=>{

 if(msg.from.id!==OWNER_ID) return

 if(!db.logs){
  bot.sendMessage(msg.chat.id,"No logs")
  return
 }

 let text="📈 Activity Logs\n\n"

 db.logs.slice(-10).forEach(l=>{
  text+=`${l.text}\n`
 })

 bot.sendMessage(msg.chat.id,text)

})

bot.onText(/\/dashboard/,msg=>{

 if(msg.from.id!==OWNER_ID) return

 const users=Object.keys(db).length

 let mails=0

 for(const u in db){
  if(db[u].mails){
   mails+=db[u].mails.length
  }
 }

 bot.sendMessage(msg.chat.id,

`📊 Dashboard

👥 Users ${users}
📧 Emails ${mails}
🔄 Transfers ${db.transfers?db.transfers.length:0}`)
})

bot.onText(/\/broadcast (.+)/,(msg,match)=>{

 if(msg.from.id!==OWNER_ID) return

 const text=match[1]

 for(const u in db){
  bot.sendMessage(u,`📢 Announcement\n\n${text}`)
 }

})

app.post("/email",(req,res)=>{

 const recipient=req.body.to
 const subject=req.body.subject

 for(const u in db){

  if(db[u].mails && db[u].mails.includes(recipient)){

   bot.sendMessage(u,
`📩 New Email

📧 ${recipient}

Subject: ${subject}`)
  }

 }

 res.send("ok")
})

app.get("/",(req,res)=>{
 res.send("Kush Temp Mail Running")
})

app.listen(process.env.PORT || 3000)