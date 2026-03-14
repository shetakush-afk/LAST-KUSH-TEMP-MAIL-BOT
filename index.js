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

let db={}

if(fs.existsSync("db.json")){
 db=JSON.parse(fs.readFileSync("db.json"))
}

function saveDB(){
 fs.writeFileSync("db.json",JSON.stringify(db,null,2))
}

function getUser(id){

 if(!db[id]){
  db[id]={credits:100,mails:[],admin:false,banned:false}
 }

 if(id==OWNER_ID) db[id].admin=true

 return db[id]
}

function isAdmin(id){

 const user=getUser(id)

 if(id==OWNER_ID) return true
 if(user.admin) return true

 return false
}

function randomMail(){
 const r=Math.random().toString(36).substring(2,8)
 return `${r}@${DOMAIN}`
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

 let buttons=[

 [{text:"📧 Generate Email",callback_data:"gen"}],

 [
 {text:"📜 My Emails",callback_data:"emails"},
 {text:"💳 Credits",callback_data:"credit"}
 ],

 [
 {text:"🔄 Transfer",callback_data:"transfer"},
 {text:"🗑 Delete",callback_data:"delete"}
 ]

 ]

 if(id==OWNER_ID){

 buttons.push([
 {text:"👑 Owner Panel",callback_data:"ownerpanel"}
 ])

 }

 bot.sendMessage(id,

`╭━━━〔 🚀 KUSHMAIL DASHBOARD 〕━━━╮

👤 ID
${id}

💳 Credits
${user.credits}

📧 Emails
${user.mails.length}

━━━━━━━━━━━━━━━━

Use menu buttons below

👑 Owner
@KUSHxTRUSTED

╰━━━━━━━━━━━━━━━━━━━━╯`,

{
reply_markup:{inline_keyboard:buttons}
})

})

bot.on("callback_query",q=>{

 const id=q.from.id
 const user=getUser(id)

 if(q.data=="gen"){

  if(id!=OWNER_ID && user.credits<=0){
   bot.sendMessage(id,"❌ No credits")
   return
  }

  if(id!=OWNER_ID) user.credits--

  let mail=randomMail()

  while(mailTaken(mail)) mail=randomMail()

  user.mails.push(mail)

  saveDB()

  bot.sendMessage(id,

`📧 EMAIL CREATED

${mail}

💳 Credits left ${user.credits}`)
 }

 if(q.data=="emails"){

  if(user.mails.length==0){
   bot.sendMessage(id,"📭 No emails")
   return
  }

  bot.sendMessage(id,user.mails.join("\n"))
 }

 if(q.data=="credit"){
  bot.sendMessage(id,`💳 Credits ${user.credits}`)
 }

 if(q.data=="ownerpanel"){

  if(id!=OWNER_ID) return

  bot.sendMessage(id,

`👑 OWNER CONTROL PANEL

/admin userid
Add admin

/removeadmin userid
Remove admin

/dashboard
Bot stats

/logs
Activity logs

/broadcast message
Send message`)
 }

})

bot.onText(/\/admin (.+)/,(msg,match)=>{

 if(msg.from.id!=OWNER_ID) return

 const uid=parseInt(match[1])

 const user=getUser(uid)

 user.admin=true

 saveDB()

 bot.sendMessage(msg.chat.id,"✅ Admin added")

})

bot.onText(/\/removeadmin (.+)/,(msg,match)=>{

 if(msg.from.id!=OWNER_ID) return

 const uid=parseInt(match[1])

 const user=getUser(uid)

 user.admin=false

 saveDB()

 bot.sendMessage(msg.chat.id,"❌ Admin removed")

})

bot.onText(/\/ban (.+)/,(msg,match)=>{

 const adminID=msg.from.id

 if(!isAdmin(adminID)) return

 const uid=parseInt(match[1])

 if(uid==OWNER_ID){
  bot.sendMessage(adminID,"❌ Cannot ban owner")
  return
 }

 const user=getUser(uid)

 user.banned=true

 saveDB()

 bot.sendMessage(adminID,"🚫 User banned")

})

bot.onText(/\/unban (.+)/,(msg,match)=>{

 if(!isAdmin(msg.from.id)) return

 const uid=parseInt(match[1])

 const user=getUser(uid)

 user.banned=false

 saveDB()

 bot.sendMessage(msg.chat.id,"✅ User unbanned")

})

bot.onText(/\/dashboard/,msg=>{

 if(msg.from.id!=OWNER_ID) return

 const users=Object.keys(db).length

 let mails=0

 for(const u in db){
  if(db[u].mails) mails+=db[u].mails.length
 }

 bot.sendMessage(msg.chat.id,

`👑 ADMIN DASHBOARD

👥 Users ${users}
📧 Emails ${mails}`)
})

app.get("/",(req,res)=>{
 res.send("KushMail Running")
})

app.listen(process.env.PORT||3000)