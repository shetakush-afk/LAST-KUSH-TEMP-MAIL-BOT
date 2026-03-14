const TelegramBot=require("node-telegram-bot-api")
const express=require("express")
const fs=require("fs")

const TOKEN=process.env.BOT_TOKEN
const OWNER_ID=Number(process.env.OWNER_ID)
const OWNER_USERNAME="@KUSHxTRUSTED"
const DOMAIN="kushxmail.store"

const bot=new TelegramBot(TOKEN,{polling:true})

const app=express()

app.get("/",(req,res)=>{
res.send("🔥 Kush Ultra Temp Mail Bot Running")
})

app.listen(process.env.PORT||3000)

let db={
users:{},
admins:[],
keys:[],
banned:[],
transfers:[],
logs:[]
}

if(fs.existsSync("./db.json")){
db=JSON.parse(fs.readFileSync("./db.json"))
}

function saveDB(){
fs.writeFileSync("./db.json",JSON.stringify(db,null,2))
}

function getUser(id){

if(!db.users[id]){
db.users[id]={credits:100,mails:[]}
}

return db.users[id]
}

function isAdmin(id){

if(id==OWNER_ID) return true

return db.admins.includes(id)
}

function randomMail(){

const chars="abcdefghijklmnopqrstuvwxyz123456789"

let name=""

for(let i=0;i<8;i++){

name+=chars[Math.floor(Math.random()*chars.length)]

}

return `${name}@${DOMAIN}`
}

function log(t){

db.logs.push({time:Date.now(),text:t})

saveDB()

}

bot.onText(/\/start/,async msg=>{

const id=msg.from.id

if(db.banned.includes(id)){
bot.sendMessage(id,"🚫 You are banned")
return
}

const user=getUser(id)

let m=await bot.sendMessage(id,

`⚡ Initializing KushMail

▰▱▱▱▱▱▱▱▱▱`)

setTimeout(()=>{

bot.editMessageText(

`🚀 KUSH ULTRA MAIL

👤 ID
${id}

💳 Credits
${user.credits}

📧 Emails
${user.mails.length}

━━━━━━━━━━━━

Select option below

👑 Owner
${OWNER_USERNAME}`,

{
chat_id:id,
message_id:m.message_id,
reply_markup:{
inline_keyboard:[

[{text:"📧 Generate Email",callback_data:"gen"}],

[
{text:"📜 My Emails",callback_data:"emails"},
{text:"💳 Credits",callback_data:"credit"}
],

[
{text:"🔄 Transfer Mail",callback_data:"transfer"},
{text:"📋 Commands",callback_data:"commands"}
]

]
}
})

},2000)

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

const mail=randomMail()

user.mails.push(mail)

saveDB()

bot.sendMessage(id,

`📧 EMAIL GENERATED

${mail}

💳 Credits left
${user.credits}`,

{
reply_markup:{
inline_keyboard:[

[{text:"📋 Copy Email",callback_data:`copy_${mail}`}],

[{text:"🗑 Delete Email",callback_data:`delete_${mail}`}]

]
}
})

log(`MAIL ${mail} CREATED BY ${id}`)

}

if(q.data=="emails"){

if(user.mails.length==0){

bot.sendMessage(id,"📭 No emails")

return

}

bot.sendMessage(id,

`📜 YOUR EMAILS

${user.mails.join("\n")}`)

}

if(q.data=="credit"){

bot.sendMessage(id,

`💳 Credits

${user.credits}`)

}

})

bot.on("callback_query",q=>{

const id=q.message.chat.id

const user=getUser(id)

if(q.data.startsWith("copy_")){

const mail=q.data.split("_")[1]

bot.sendMessage(id,

`📋 COPY EMAIL

${mail}`)

}

if(q.data.startsWith("delete_")){

const mail=q.data.split("_")[1]

user.mails=user.mails.filter(m=>m!==mail)

saveDB()

bot.sendMessage(id,"🗑 Email deleted")

}

})

bot.onText(/\/transfer (.+) (.+)/,(msg,match)=>{

const id=msg.from.id

const mail=match[1]

const target=match[2]

const user=getUser(id)

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

if(!isAdmin(id)){

bot.sendMessage(id,"❌ Admin only")

return

}

const credits=match[1]

const key="KUSH-"+Math.random().toString(36).substring(2,8)

db.keys.push({key,credits})

saveDB()

bot.sendMessage(id,

`🔑 CREDIT KEY

${key}

Credits
${credits}`)

})

bot.onText(/\/redeem (.+)/,(msg,match)=>{

const key=match[1]

const id=msg.from.id

const user=getUser(id)

const data=db.keys.find(k=>k.key==key)

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

bot.onText(/\/admin (.+)/,(msg,match)=>{

if(msg.from.id!=OWNER_ID){

bot.sendMessage(msg.chat.id,"❌ Owner only")

return

}

const uid=Number(match[1])

db.admins.push(uid)

saveDB()

bot.sendMessage(msg.chat.id,"👑 Admin added")

})

bot.onText(/\/ban (.+)/,(msg,match)=>{

const id=msg.from.id

if(!isAdmin(id)) return

const target=Number(match[1])

if(target==OWNER_ID){

bot.sendMessage(id,"❌ Cannot ban owner")

return

}

db.banned.push(target)

saveDB()

bot.sendMessage(id,"🚫 User banned")

})

bot.onText(/\/dashboard/,msg=>{

if(msg.from.id!=OWNER_ID) return

const users=Object.keys(db.users).length

let mails=0

for(const u in db.users){

mails+=db.users[u].mails.length

}

bot.sendMessage(msg.chat.id,

`👑 OWNER DASHBOARD

👥 Users
${users}

📧 Emails
${mails}

🔑 Keys
${db.keys.length}

🔄 Transfers
${db.transfers.length}`)

})