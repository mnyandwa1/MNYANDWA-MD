const {
    gmd,
    gitRepoRegex,
    MAX_MEDIA_SIZE,
    getFileSize,
    getMimeCategory,
    getMimeFromUrl,
} = require("../kevo");

const GIFTED_DLS = require("gifted-dls");
const giftedDls = new GIFTED_DLS();
const axios = require("axios");
const { sendButtons } = require("gifted-btns");

const BOT_NAME = "MNYANDWA-MD";

function extractButtonId(msg) {
    if (!msg) return null;

    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;

    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;

    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;

    if (msg.interactiveResponseMessage) {
        const native =
            msg.interactiveResponseMessage.nativeFlowResponseMessage;

        if (native?.paramsJson) {
            try {
                const data = JSON.parse(native.paramsJson);
                if (data.id) return data.id;
            } catch {}
        }

        return msg.interactiveResponseMessage.buttonId || null;
    }

    return null;
}

function cleanName(name = "file") {
    return name.replace(/[^\w\s.-]/gi, "");
}

function downloadBox(title, body) {
    return `
╭━━━〔 ${BOT_NAME} ⚡ 〕━━━╮
┃ 📥 ${title}
┃
${body}
╰━━━━━━━━━━━━━━━━━━╯
`;
}


// ===============================
//        GITHUB DOWNLOADER
// ===============================

gmd(
{
    pattern: "gitclone",
    category: "downloader",
    react: "📦",
    aliases: [
        "gitdl",
        "github",
        "git",
        "clone"
    ],
    description: "Download Github repository"
},

async (from, Gifted, conText)=>{

const {
    q,
    mek,
    reply,
    react,
    botName,
    newsletterJid
}=conText;


if(!q){
    await react("❌");
    return reply(
`${downloadBox(
"GitHub Downloader",
`
┃ 🔗 Weka Github link

Example:
.gitclone https://github.com/user/repo
`
)}`
);
}


if(!gitRepoRegex.test(q)){
    await react("❌");
    return reply(
`${downloadBox(
"Invalid Link",
"┃ ❌ Github link sio sahihi"
)}`
);
}


try{

let [,user,repo]=q.match(gitRepoRegex)||[];

repo = repo.replace(".git","")
.split("/")[0];


const info =
`╭━━〔 ${BOT_NAME} 〕━━╮

📦 Repository:
${user}/${repo}

⏳ Preparing download...

╰━━━━━━━━━━━━━━╯`;

await reply(info);


const api =
`https://api.github.com/repos/${user}/${repo}`;


const check =
await axios.get(api);


if(!check.data){

await react("❌");
return reply("Repository haipo au ni private.");
}


const branch =
check.data.default_branch || "main";


const zip =
`https://api.github.com/repos/${user}/${repo}/zipball`;


await Gifted.sendMessage(
from,
{
document:{url:zip},
fileName:
`${user}-${repo}-${branch}.zip`,
mimetype:"application/zip"
},
{
quoted:mek
});


await react("✅");


}catch(e){

console.log(e);

await react("❌");

return reply(
"Imeshindikana kupakua Github repo."
);

}

});// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 2
// ===============================


gmd(
    {
        pattern: "tiktok",
        category: "downloader",
        react: "🎵",
        aliases: ["tt", "ttdl", "tiktokdl"],
        description: "Download TikTok videos without watermark",
    },

    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            gmdBuffer,
            toAudio,
            GiftedTechApi,
            GiftedApiKey,
            MAX_MEDIA_SIZE
        } = conText;


        if (!q) {
            await react("❌");
            return reply(
                `╭━━━〔 ${botName} 〕━━━╮\n` +
                `❌ Weka link ya TikTok\n\n` +
                `Mfano:\n.tt https://tiktok.com/xxxx\n` +
                `╰━━━━━━━━━━━━━━╯`
            );
        }


        if (!q.includes("tiktok.com")) {
            await react("❌");
            return reply("❌ Hii sio link ya TikTok");
        }


        try {

            const api = `${GiftedTechApi}/api/download/tiktokdlv2?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;

            const res = await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success || !res.data?.result){

                await react("❌");
                return reply("TikTok haijapatikana");

            }


            const data = res.data.result;


            const video = data.video || data.download_url;
            const music = data.music;


            const title =
            data.title ||
            "TikTok Video";


            const author =
            data.author?.name ||
            "Unknown";


            const id = Date.now();



            await sendButtons(Gifted,from,{

                title:`${botName} 🎵 TIKTOK`,

                text:
`╭━━〔 TIKTOK DOWNLOADER 〕━━╮

🎬 Title:
${title}

👤 Creator:
${author}

Chagua unachotaka 👇

╰━━━━━━━━━━━━━━╯`,

                footer:botFooter,

                buttons:[

                    {
                        id:`ttv_${id}`,
                        text:"🎬 Video"
                    },

                    {
                        id:`tta_${id}`,
                        text:"🎧 Audio"
                    }

                ]

            });



            const listener = async(event)=>{


                const msg = event.messages[0];

                if(!msg.message)return;


                const btn =
                extractButtonId(msg.message);


                if(!btn)return;


                if(!btn.includes(id))return;


                if(msg.key.remoteJid !== from)return;



                await react("⬇️");



                try{


                    if(btn.startsWith("ttv")){


                        await Gifted.sendMessage(
                            from,
                            {
                                video:{
                                    url:video
                                },

                                mimetype:"video/mp4",

                                caption:
`Downloaded by ${botName}`
                            },

                            {
                                quoted:msg
                            }
                        );


                    }



                    else if(btn.startsWith("tta")){


                        let audio;


                        if(music){

                            audio =
                            await gmdBuffer(music);

                        }

                        else{

                            const buff =
                            await gmdBuffer(video);

                            audio =
                            await toAudio(buff);

                        }



                        await Gifted.sendMessage(
                            from,
                            {

                                audio:audio,

                                mimetype:
                                "audio/mpeg"

                            },

                            {
                                quoted:msg
                            }
                        );


                    }



                    await react("✅");


                }

                catch(e){

                    console.log(e);

                    await react("❌");

                    reply(
                    "Imeshindikana kupakua.",
                    msg
                    );

                }


            };



            Gifted.ev.on(
                "messages.upsert",
                listener
            );


            setTimeout(()=>{

                Gifted.ev.off(
                    "messages.upsert",
                    listener
                );

            },300000);



        }

        catch(err){

            console.log(err);

            await react("❌");

            reply(
            "Server imekataa, jaribu tena."
            );

        }

    }

);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 3
// INSTAGRAM DOWNLOADER
// ===============================


gmd(
{
    pattern:"ig",
    category:"downloader",
    react:"📸",
    aliases:[
        "instagram",
        "instadl",
        "igdl",
        "reels"
    ],
    description:"Download Instagram reels and videos"
},

async(from,Gifted,conText)=>{


const {
    q,
    mek,
    reply,
    react,
    botName,
    botFooter,
    gmdBuffer,
    toAudio,
    GiftedTechApi,
    GiftedApiKey
}=conText;



if(!q){

    await react("❌");

    return reply(
`╭━━〔 ${botName} 〕━━╮

📸 Weka Instagram link

Mfano:
.ig https://instagram.com/reel/xxxx

╰━━━━━━━━━━━━╯`
    );

}



if(!q.includes("instagram.com")){

    await react("❌");

    return reply(
    "❌ Hii sio link ya Instagram"
    );

}



try{


const url =
`${GiftedTechApi}/api/download/instadl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(url,{
    timeout:60000
});



if(!res.data?.success ||
!res.data?.result){


await react("❌");

return reply(
"Instagram media haijapatikana"
);


}



const data =
res.data.result;



const media =
data.download_url ||
data.url;



const thumb =
data.thumbnail;



const title =
data.title ||
"Instagram Video";



const id =
Date.now();




await sendButtons(
Gifted,
from,
{

title:
`${botName} 📸 INSTAGRAM`,


text:
`╭━━〔 INSTAGRAM DOWNLOADER 〕━━╮

🎬 ${title}

Chagua aina ya download 👇

╰━━━━━━━━━━━━━━━━╯`,


footer:
botFooter,


image:{
url:thumb
},


buttons:[

{
id:`igv_${id}`,
text:"🎬 Video"
},

{
id:`iga_${id}`,
text:"🎧 Audio"
}

]

}
);





const handler =
async(event)=>{


const msg =
event.messages[0];


if(!msg.message)return;



const button =
extractButtonId(msg.message);



if(!button)return;



if(!button.includes(id))
return;



if(msg.key.remoteJid!==from)
return;



await react("⬇️");



try{


if(button.startsWith("igv")){


await Gifted.sendMessage(
from,
{

video:{
url:media
},

mimetype:
"video/mp4",

caption:
`Downloaded by ${botName}`

},

{
quoted:msg
}
);


}



if(button.startsWith("iga")){


const video =
await gmdBuffer(media);



const audio =
await toAudio(video);



await Gifted.sendMessage(
from,
{

audio:audio,

mimetype:
"audio/mpeg"

},

{
quoted:msg
}
);



}



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"Download imegoma.",
msg
);

}



};



Gifted.ev.on(
"messages.upsert",
handler
);



setTimeout(()=>{


Gifted.ev.off(
"messages.upsert",
handler
);


},300000);



}

catch(e){


console.log(e);


await react("❌");


reply(
"Server error, jaribu tena."
);


}



}

);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 4
// FACEBOOK + TWITTER DOWNLOADER
// ===============================


// ===============================
// FACEBOOK DOWNLOADER
// ===============================

gmd(
{
    pattern:"fb",
    category:"downloader",
    react:"📘",
    aliases:[
        "facebook",
        "fbdl"
    ],
    description:"Download Facebook videos"
},

async(from,Gifted,conText)=>{


const {
q,
mek,
reply,
react,
botName,
botFooter,
GiftedTechApi,
GiftedApiKey
}=conText;



if(!q){

await react("❌");

return reply(
"📘 Weka Facebook video link"
);

}



if(!q.includes("facebook.com") &&
!q.includes("fb.watch")){

await react("❌");

return reply(
"❌ Link sio ya Facebook"
);

}



try{


const api =
`${GiftedTechApi}/api/download/facebook?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"Video haijapatikana"
);

}



const data =
res.data.result;



const video =
data.hd_video ||
data.sd_video;



await Gifted.sendMessage(
from,
{

video:{
url:video
},

mimetype:
"video/mp4",

caption:
`╭━━〔 ${botName} 〕━━╮

📘 Facebook Downloader

${data.title || "Facebook Video"}

╰━━━━━━━━━━━━╯`

},

{
quoted:mek
}
);



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"Facebook download error"
);

}


}

);




// ===============================
// TWITTER / X DOWNLOADER
// ===============================


gmd(
{
pattern:"twitter",
category:"downloader",
react:"🐦",

aliases:[
"x",
"xdl",
"twitterdl"
],

description:"Download Twitter/X videos"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"Weka Twitter/X link"
);

}



if(!q.includes("twitter.com") &&
!q.includes("x.com")){

await react("❌");

return reply(
"❌ Hii sio Twitter/X link"
);

}



try{


const api =
`${GiftedTechApi}/api/download/twitter?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"Video haijapatikana"
);

}



const data =
res.data.result;



const video =
data.videoUrls?.[0]?.url;



if(!video){

await react("❌");

return reply(
"No video found"
);

}



await Gifted.sendMessage(
from,
{

video:{
url:video
},

mimetype:
"video/mp4",

caption:
`🐦 Twitter/X Downloader

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"Twitter download error"
);


}


}

);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 5
// YOUTUBE + SPOTIFY
// ===============================



// ===============================
// YOUTUBE DOWNLOADER
// ===============================


gmd(
{
    pattern:"ytv",
    category:"downloader",
    react:"▶️",

    aliases:[
        "youtube",
        "ytvideo",
        "ytmp4"
    ],

    description:"Download YouTube videos"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
`▶️ Weka YouTube link

Mfano:
.ytv https://youtube.com/watch?v=xxxx`
);

}




if(!q.includes("youtube.com") &&
!q.includes("youtu.be")){

await react("❌");

return reply(
"❌ Hii sio YouTube link"
);

}



try{


const api =
`${GiftedTechApi}/api/download/youtube?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"YouTube video haijapatikana"
);

}



const data =
res.data.result;



const video =
data.download_url ||
data.video;



await Gifted.sendMessage(
from,
{

video:{
url:video
},

mimetype:
"video/mp4",

caption:

`╭━━〔 ${botName} 〕━━╮

▶️ YouTube Downloader

🎬 ${data.title || "Video"}

╰━━━━━━━━━━━━╯`

},

{
quoted:mek
}

);



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"YouTube error"
);


}


}

);







// ===============================
// SPOTIFY DOWNLOADER
// ===============================


gmd(
{
pattern:"spotify",

category:"downloader",

react:"🎧",

aliases:[
"spoti",
"spotifydl"
],

description:"Download Spotify music"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey,
formatAudio,
gmdBuffer

}=conText;




if(!q){

await react("❌");

return reply(
"🎧 Weka Spotify link au jina la wimbo"
);

}



try{


const api =
`${GiftedTechApi}/api/download/spotifydl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"Spotify haijapatikana"
);

}



const data =
res.data.result;



const audioUrl =
data.download_url;



const buffer =
await gmdBuffer(audioUrl);



const audio =
await formatAudio(buffer);



await Gifted.sendMessage(
from,
{

audio:audio,

mimetype:
"audio/mpeg",

caption:
`🎧 ${data.title || "Spotify Song"}

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");


}

catch(e){

console.log(e);

await react("❌");

reply(
"Spotify download error"
);


}


}
// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 6
// GDRIVE + MEDIAFIRE + APK
// ===============================



// ===============================
// GOOGLE DRIVE DOWNLOADER
// ===============================


gmd(
{
pattern:"gdrive",
category:"downloader",
react:"📁",

aliases:[
"drive",
"googledrive",
"gdrivedl"
],

description:"Download Google Drive files"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"📁 Weka Google Drive link"
);

}



if(!q.includes("drive.google.com")){

await react("❌");

return reply(
"❌ Link sio Google Drive"
);

}



try{


const api =
`${GiftedTechApi}/api/download/gdrivedl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"File haijapatikana"
);

}



const data =
res.data.result;



await Gifted.sendMessage(
from,
{

document:{
url:data.download_url
},

fileName:
data.name || "drive_file",

mimetype:
"application/octet-stream",

caption:
`📁 Google Drive

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"GDrive error"
);

}


}

);






// ===============================
// MEDIAFIRE DOWNLOADER
// ===============================


gmd(
{
pattern:"mediafire",

category:"downloader",

react:"🔥",

aliases:[
"mfire",
"mf"
],

description:"Download MediaFire files"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"🔥 Weka MediaFire link"
);

}



if(!q.includes("mediafire.com")){

await react("❌");

return reply(
"❌ Hii sio MediaFire"
);

}



try{


const api =
`${GiftedTechApi}/api/download/mediafire?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"File haijapatikana"
);

}



const data =
res.data.result;



await Gifted.sendMessage(
from,
{

document:{
url:data.downloadUrl
},

fileName:
data.fileName || "mediafire_file",

mimetype:
"application/octet-stream",

caption:
`🔥 MediaFire Downloader

${data.fileName || ""}

${botName}`

},

{
quoted:mek
}

);



await react("✅");



}

catch(e){

console
);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 7
// GITHUB + PASTEBIN
// ===============================



// ===============================
// GITHUB REPOSITORY DOWNLOADER
// ===============================


gmd(
{
    pattern:"gitclone",

    category:"downloader",

    react:"📦",

    aliases:[
        "git",
        "github",
        "repodl"
    ],

    description:"Download Github repository"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName

}=conText;



if(!q){

await react("❌");

return reply(
`📦 Weka Github link

Mfano:
.gitclone https://github.com/user/repo`
);

}



if(!q.includes("github.com")){

await react("❌");

return reply(
"❌ Hii sio Github link"
);

}



try{


let parts =
q.split("/");


let user =
parts[3];


let repo =
parts[4]
?.replace(".git","");



if(!user || !repo){

return reply(
"Github link sio sahihi"
);

}



const zip =
`https://github.com/${user}/${repo}/archive/refs/heads/main.zip`;



await Gifted.sendMessage(
from,
{

document:{
url:zip
},

fileName:
`${repo}.zip`,

mimetype:
"application/zip",

caption:

`📦 Github Clone

Repository:
${user}/${repo}

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");



}

catch(e){

console.log(e);

await react("❌");

reply(
"Github download error"
);

}


}

);








// ===============================
// PASTEBIN DOWNLOADER
// ===============================


gmd(
{
pattern:"pastebin",

category:"downloader",

react:"📋",

aliases:[
"paste",
"pastedl"
],

description:"Get Pastebin content"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"📋 Weka Pastebin link"
);

}



if(!q.includes("pastebin.com")){

await react("❌");

return reply(
"❌ Link sio Pastebin"
);

}



try{


const api =
`${GiftedTechApi}/api/download/pastebin?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:30000
});



if(!res.data?.success){

await react("❌");

return reply(
"Paste haijapatikana"
);

}



let text =
res.data.result;



if(text.length > 60000){


await Gifted.sendMessage(
from,
{

document:
Buffer.from(text),

fileName:
"pastebin.txt",

mimetype:
"text/plain"

},

{
quoted:mek
}

);


}

else{


await Gifted.sendMessage(
from,
{

text:

`📋 ${botName} PASTEBIN

━━━━━━━━━━━━

${text}`

},

{
quoted:mek
}

);


}



await react("✅");


}

catch(e){

console.log(e);

await react("❌");

reply(
"Pastebin error"
);

}


}

);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 8
// SOUNDCLOUD + PINTEREST + SNAPCHAT
// ===============================



// ===============================
// SOUNDCLOUD DOWNLOADER
// ===============================


gmd(
{
    pattern:"soundcloud",
    category:"downloader",
    react:"🎶",

    aliases:[
        "sc",
        "scdl",
        "sounddl"
    ],

    description:"Download SoundCloud songs"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
gmdBuffer,
formatAudio,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"🎶 Weka SoundCloud link"
);

}



try{


const api =
`${GiftedTechApi}/api/download/soundcloud?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"Wimbo haujapatikana"
);

}



const data =
res.data.result;



const buffer =
await gmdBuffer(data.download_url);



const audio =
await formatAudio(buffer);



await Gifted.sendMessage(
from,
{

audio:audio,

mimetype:
"audio/mpeg",

caption:

`🎶 SoundCloud

${data.title || "Music"}

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");


}

catch(e){

console.log(e);

await react("❌");

reply(
"SoundCloud error"
);

}


}

);







// ===============================
// PINTEREST DOWNLOADER
// ===============================


gmd(
{
pattern:"pinterest",

category:"downloader",

react:"📌",

aliases:[
"pin",
"pindl"
],

description:"Download Pinterest media"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"📌 Weka Pinterest link"
);

}



if(!q.includes("pinterest")){

await react("❌");

return reply(
"❌ Link sio Pinterest"
);

}



try{


const api =
`${GiftedTechApi}/api/download/pinterest?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



const data =
res.data.result;



const media =
data.download_url ||
data.url;



await Gifted.sendMessage(
from,
{

video:{
url:media
},

caption:

`📌 Pinterest Downloader

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");


}

catch(e){

console.log(e);

await react("❌");

reply(
"Pinterest error"
);

}


}

);







// ===============================
// SNAPCHAT DOWNLOADER
// ===============================


gmd(
{
pattern:"snapchat",

category:"downloader",

react:"👻",

aliases:[
"snap",
"snapdl"
],

description:"Download Snapchat videos"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName,
GiftedTechApi,
GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(
"👻 Weka Snapchat link"
);

}



try{


const api =
`${GiftedTechApi}/api/download/snapchat?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;



const res =
await axios.get(api,{
timeout:60000
});



if(!res.data?.success){

await react("❌");

return reply(
"Snapchat video haijapatikana"
);

}



const data =
res.data.result;



await Gifted.sendMessage(
from,
{

video:{
url:data.download_url
},

caption:

`👻 Snapchat Downloader

Powered by ${botName}`

},

{
quoted:mek
}

);



await react("✅");


}

catch(e){

console.log(e);

await react("❌");

reply(
"Snapchat error"
);

}


}

);// ===============================
// MNYANDWA-MD DOWNLOADER ENGINE
// PART 9 FINAL
// EXTRA TOOLS + BOT INFO
// ===============================



// ===============================
// MEDIA INFO CHECK
// ===============================


gmd(
{
    pattern:"mediainfo",

    category:"tools",

    react:"🔎",

    aliases:[
        "urlinfo",
        "checkurl"
    ],

    description:"Check media information"

},


async(from,Gifted,conText)=>{


const {

q,
mek,
reply,
react,
botName

}=conText;



if(!q){

await react("❌");

return reply(
"🔎 Weka URL ya kuangalia"
);

}



try{


const response =
await axios.head(q);



const type =
response.headers["content-type"] ||
"Unknown";



const size =
response.headers["content-length"] || 
"Unknown";



await Gifted.sendMessage(
from,
{

text:

`╭━━〔 ${botName} 〕━━╮

🔎 MEDIA INFO

🌐 URL:
${q}

📂 Type:
${type}

📦 Size:
${size}

╰━━━━━━━━━━━━╯`

},

{
quoted:mek
}

);



await react("✅");


}

catch(e){

await react("❌");

reply(
"Imeshindikana kupata taarifa"
);

}


}

);







// ===============================
// DOWNLOADER MENU
// ===============================


gmd(
{
pattern:"downloadmenu",

category:"main",

react:"📥",

aliases:[
"dlmenu",
"dl"
],

description:"Downloader commands list"

},


async(from,Gifted,conText)=>{


const {

reply,
botName

}=conText;



return reply(

`╭━━〔 ${botName} 〕━━╮

📥 DOWNLOADER MENU

🎵 TikTok
. tiktok

📸 Instagram
. ig

📘 Facebook
. fb

🐦 Twitter/X
. twitter

▶️ YouTube
. ytv

🎧 Spotify
. spotify

📁 Google Drive
. gdrive

🔥 MediaFire
. mediafire

📱 APK
. apk

📦 Github
. gitclone

📋 Pastebin
. pastebin

🎶 SoundCloud
. soundcloud

📌 Pinterest
. pinterest

👻 Snapchat
. snapchat


╰━━━━━━━━━━━━╯

⚡ Powered by MNYANDWA-MD`

);


}

);







// ===============================
// BOT ABOUT
// ===============================


gmd(
{
pattern:"dlabout",

category:"main",

react:"🤖",

aliases:[
"downloaderinfo"
],

description:"Downloader information"

},


async(from,Gifted,conText)=>{


const {

reply,
botName

}=conText;



reply(

`╭━━〔 🤖 ${botName} 〕━━╮

🔥 Advanced Downloader System

👑 Owner:
Kelvin Mnyandwa

⚡ Engine:
MNYANDWA-MD

📥 Features:
✔ Video Downloader
✔ Audio Downloader
✔ File Downloader
✔ Social Media Downloader

🚀 Version:
2.0

╰━━━━━━━━━━━━╯`

);


}

);



// ===============================
// END OF DOWNLOADER2.JS
// ===============================
