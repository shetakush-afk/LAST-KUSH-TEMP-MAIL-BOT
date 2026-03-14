import TelegramBot from "node-telegram-bot-api"
import fs from "fs-extra"
import express from "express"

const TOKEN = process.env.BOT_TOKEN
const OWNER_ID = Number(process.env.OWNER_ID)
const OWNER_USERNAME = process.env.OWNER_USERNAME
const DOMAIN = process.env.DOMAIN

const bot = new TelegramBot(TOKEN,{polling:true})

const app = express()
app.get("/",(req,res)=>res.send("🔥 Kush Ultra Temp Mail Bot Running"))
app.listen(process.env.PORT || 3000)

let db = {users:{},admins:[],banned:[],keys:[],logs:[],transfers:[]}

if(fs.existsSync("./db.json")){
 db = fs.readJsonSync("./db.json")
}

function saveDB(){
 fs.writeJsonSync("./db.json",db,{spaces:2})
}

function getUser(id){

 if(!db.users[id]){
  db.users[id]={credits:100,mails:[]}
 }

 return db.users[id]
}

function randomMail(){

 const chars="abcdefghijklmnopqrstuvwxyz123456789"
 let name=""

 for(let i=0;i<8;i++){
  name+=chars[Math.floor(Math.random()*chars.length)]
 }

 return `${name}@${DOMAIN}`
}

function log(text){
 db.logs.push({time:Date.now(),text})
 saveDB()
}

function isAdmin(id){
 return db.admins.includes(id)
}

function isBanned(id){
 return db.banned.includes(id)
}

bot.onText(/\/start/,async msg=>{

 const id = msg.from.id

 if(isBanned(id)){
  bot.sendMessage(id,"🚫 You are banned")
  return
 }

 const user = getUser(id)

 let m = await bot.sendMessage(id,
`⚡ Initializing Kush Mail System
▰▱▱▱▱▱▱▱▱▱`)

 setTimeout(()=>{

 bot.editMessageText(
`🔥 KUSH TEMP MAIL

👤 User: ${id}
💳 Credits: ${user.credits}

Loading Commands...`,
{chat_id:id,message_id:m.message_id})

 },1500)

 setTimeout(()=>{

 bot.editMessageText(
`✨ KUSH TEMP MAIL ✨

📧 /generate → Create Email
💳 /credit → Credits
📜 /id → Email History
🔁 /transfer → Transfer Mail
📋 /commands → Menu

👑 Owner
${OWNER_USERNAME}`,
{chat_id:id,message_id:m.message_id})

 },3000)

 saveDB()

})

bot.onText(/\/commands/,msg=>{

 bot.sendMessage(msg.chat.id,
`📜 COMMAND MENU

📧 /generate
💳 /credit
📜 /id
🔁 /transfer email userid
🎁 /redeem key

👑 Owner
${OWNER_USERNAME}`)

})

bot.onText(/\/generate/,async msg=>{

 const id=msg.from.id
 const user=getUser(id)

 if(id!=OWNER_ID && user.credits<=0){
  bot.sendMessage(id,"❌ No credits")
  return
 }

 let loading = await bot.sendMessage(id,
`⚡ Generating Email
▰▱▱▱▱▱▱▱▱▱`)

 setTimeout(()=>{

 let mail=randomMail()

 if(id!=OWNER_ID){
  user.credits--
 }

 user.mails.push(mail)

 saveDB()

 bot.editMessageText(
`🎉 EMAIL GENERATED

📧 ${mail}

💳 Remaining Credits
${user.credits}`,
{
 chat_id:id,
 message_id:loading.message_id,
 reply_markup:{
  inline_keyboard:[
   [{text:"📋 Copy Email",callback_data:`copy_${mail}`}],
   [{text:"🗑 Delete Email",callback_data:`delete_${mail}`}]
  ]
 }
})

 log(`EMAIL ${mail} CREATED BY ${id}`)

 },2000)

})

bot.on("callback_query",q=>{

 const id=q.message.chat.id
 const user=getUser(id)

 if(q.data.startsWith("copy_")){

  const mail=q.data.split("_")[1]

  bot.sendMessage(id,
`📋 Copy Email

${mail}`)

 }

 if(q.data.startsWith("delete_")){

  const mail=q.data.split("_")[1]

  user.mails=user.mails.filter(m=>m!==mail)

  saveDB()

  bot.sendMessage(id,"🗑 Email Deleted")

 }

})

bot.onText(/\/credit/,msg=>{

 const user=getUser(msg.from.id)

 bot.sendMessage(msg.chat.id,
`💳 Remaining Credits

${user.credits}`)

})

bot.onText(/\/id/,msg=>{

 const user=getUser(msg.from.id)

 if(user.mails.length===0){
  bot.sendMessage(msg.chat.id,"❌ No emails")
  return
 }

 bot.sendMessage(msg.chat.id,
`📧 Your Emails

${user.mails.join("\n")}`)

})

bot.onText(/\/transfer (.+) (.+)/,(msg,match)=>{

 const id=msg.from.id
 const user=getUser(id)

 const mail=match[1]
 const target=match[2]

 if(!user.mails.includes(mail)){
  bot.sendMessage(id,"❌ Not your email")
  return
 }

 const targetUser=getUser(target)

 user.mails=user.mails.filter(m=>m!==mail)
 targetUser.mails.push(mail)

 db.transfers.push({from:id,to:target,mail})

 saveDB()

 bot.sendMessage(id,"✅ Email transferred")

})

bot.onText(/\/genkey (.+)/,(msg,match)=>{

 const id=msg.from.id

 if(id!=OWNER_ID && !isAdmin(id)){
  bot.sendMessage(id,"❌ Not allowed")
  return
 }

 const credits=match[1]
 const key="KEY-"+Math.random().toString(36).substring(2,8)

 db.keys.push({key,credits})

 saveDB()

 bot.sendMessage(id,
`🔑 CREDIT KEY GENERATED

Key: ${key}
Credits: ${credits}`)

})

bot.onText(/\/redeem (.+)/,(msg,match)=>{

 const key=match[1]
 const id=msg.from.id

 const user=getUser(id)

 const data=db.keys.find(k=>k.key===key)

 if(!data){
  bot.sendMessage(id,"❌ Invalid key")
  return
 }

 user.credits+=Number(data.credits)

 db.keys=db.keys.filter(k=>k.key!==key)

 saveDB()

 bot.sendMessage(id,
`🎁 Credits Added

+${data.credits}`)

})

bot.onText(/\/ban (.+)/,(msg,match)=>{

 const id=msg.from.id

 if(id!=OWNER_ID && !isAdmin(id)){
  bot.sendMessage(id,"❌ Not allowed")
  return
 }

 const target=Number(match[1])

 if(target==OWNER_ID){
  bot.sendMessage(id,"❌ Cannot ban owner")
  return
 }

 db.banned.push(target)

 saveDB()

 bot.sendMessage(id,"🚫 User banned")

})

bot.onText(/\/admin (.+)/,(msg,match)=>{

 const id=msg.from.id

 if(id!=OWNER_ID){
  bot.sendMessage(id,"❌ Owner only")
  return
 }

 const target=Number(match[1])

 db.admins.push(target)

 saveDB()

 bot.sendMessage(id,"👑 Admin added")

})