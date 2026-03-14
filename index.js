const TelegramBot = require("nodeimport TelegramBot from "node-telegram-bot-api"
import fs from "fs-extra"
import express from "express"

const TOKEN = process.env.BOT_TOKEN
const OWNER_ID = process.env.OWNER_ID
const OWNER_USERNAME = process.env.OWNER_USERNAME
const DOMAIN = process.env.DOMAIN

const bot = new TelegramBot(TOKEN,{polling:true})

const app = express()

app.get("/",(req,res)=>res.send("Kush Mail Bot Running"))

app.listen(process.env.PORT || 3000)

let db = fs.readJsonSync("./db.json")

function saveDB(){
 fs.writeJsonSync("./db.json",db,{spaces:2})
}

function getUser(id){

 if(!db.users[id]){

  db.users[id]={
   credits:100,
   mails:[]
  }

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

function mailTaken(mail){

 for(let u in db.users){
  if(db.users[u].mails.includes(mail)){
   return true
  }
 }

 return false

}

bot.onText(/\/start/,async msg=>{

 const id=msg.from.id
 const user=getUser(id)

 let m=await bot.sendMessage(id,
`⚡ Loading Kush Mail System
▰▱▱▱▱▱▱▱▱▱`)

 setTimeout(async()=>{

 await bot.editMessageText(

`🚀 KUSH TEMP MAIL

👤 ${id}
💳 Credits ${user.credits}

Loading commands...`,

{chat_id:id,message_id:m.message_id})

 },1500)

 setTimeout(async()=>{

 await bot.editMessageText(

`✨ KUSH TEMP MAIL ✨

👤 User ${id}
💳 Credits ${user.credits}
📧 Emails ${user.mails.length}

━━━━━━━━━━

/generate → Create email
/credit → Credits
/id → Email history
/transfer → Transfer mail
/commands → Commands

👑 Owner
${OWNER_USERNAME}`,

{chat_id:id,message_id:m.message_id})

 },3000)

 saveDB()

})

bot.onText(/\/generate/,async msg=>{

 const id=msg.from.id
 const user=getUser(id)

 if(id!=OWNER_ID && user.credits<=0){

  bot.sendMessage(id,"❌ No credits left")
  return

 }

 let loading=await bot.sendMessage(id,
`⚡ Generating Email
▰▱▱▱▱▱▱▱▱▱`)

 setTimeout(async()=>{

 let mail=randomMail()

 while(mailTaken(mail)){
  mail=randomMail()
 }

 if(id!=OWNER_ID){
  user.credits--
 }

 user.mails.push(mail)

 saveDB()

 await bot.editMessageText(

`🎉 EMAIL GENERATED

📧 ${mail}

💳 Remaining Credits
${user.credits}`,

{
chat_id:id,
message_id:loading.message_id
})

 },2000)

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

  bot.sendMessage(id,"❌ You don't own this email")
  return

 }

 const targetUser=getUser(target)

 user.mails=user.mails.filter(m=>m!==mail)

 targetUser.mails.push(mail)

 db.transfers.push({
  from:id,
  to:target,
  mail
 })

 saveDB()

 bot.sendMessage(id,"✅ Email transferred")

 bot.sendMessage(target,
`📧 You received email

${mail}`)

})