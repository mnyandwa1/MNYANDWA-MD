const {
    gmd,
    MAX_MEDIA_SIZE,
    getMimeCategory,
    getMimeFromUrl,
} = require("../kevo"),
axios = require("axios"),
{ sendButtons } = require("gifted-btns");


const BOT_NAME = "MNYANDWA-MD";
const OWNER = "Kelvin";


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
        msg.interactiveResponseMessage
        ?.nativeFlowResponseMessage;


        if (native?.paramsJson) {

            try {

                const data =
                JSON.parse(native.paramsJson);

                if (data.id)
                    return data.id;

            } catch {}

        }


        return msg.interactiveResponseMessage.buttonId || null;

    }


    return null;

}



async function retryRequest(url, times = 3){

    for(let i = 0; i < times; i++){

        try{

            return await axios.get(url,{
                timeout:60000
            });

        }catch(err){

            if(i === times - 1)
                throw err;

        }

    }

}




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
    gmdBuffer,
    formatAudio,
    GiftedTechApi,
    GiftedApiKey

}=conText;



if(!q){

await react("❌");

return reply(

`╭━━━〔 ${BOT_NAME} 〕━━━╮

🎧 Spotify Downloader

Tuma jina la wimbo au link.

Mfano:
.spotify Alan Walker Spectre


👤 Owner: ${OWNER}

╰━━━━━━━━━━━━━━╯`

);

}



try{


let searchAPI =

`${GiftedTechApi}/api/search/spotifysearch?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;



let response =
await retryRequest(searchAPI);



let results =
response.data?.results;



if(!results){

await react("❌");

return reply(
"Wimbo haujapatikana."
);

}



let tracks =
Array.isArray(results)
?
results.slice(0,3)
:
[results];



let idTime =
Date.now();



let buttons =
tracks.map((song,index)=>({

id:`song_${index}_${idTime}`,

text:
(song.title ||
song.name ||
"Unknown")
.substring(0,20)

}));



let list =
tracks.map((song,index)=>

`${index + 1}. ${
song.title ||
song.name ||
"Unknown"
}`

).join("\n");



await sendButtons(
Gifted,
from,
{

title:`🎧 ${BOT_NAME}`,

text:

`*Spotify Search*

${list}


Chagua wimbo 👇`,

footer:
`Powered by ${OWNER}`,

buttons

}
);





const handler = async(event)=>{


const msg =
event.messages[0];


if(!msg.message)
return;



const button =
extractButtonId(msg.message);



if(!button)
return;



if(!button.includes(idTime))
return;



if(msg.key.remoteJid !== from)
return;



try{


await react("⬇️");



let index =
Number(button.split("_")[1]);



let track =
tracks[index];



let url =

track.url ||
track.link ||
track.external_urls?.spotify;



if(!url){

await react("❌");

return reply(
"Link haipatikani",
msg
);

}




let api =

`${GiftedTechApi}/api/download/spotifydl?apikey=${GiftedApiKey}&url=${encodeURIComponent(url)}`;



let download =
await axios.get(api);



let file =
await gmdBuffer(
download.data.result.download_url
);



let audio =
await formatAudio(file);



await Gifted.sendMessage(
from,
{
audio,
mimetype:"audio/mpeg"
},
{
quoted:msg
}
);



await react("✅");



Gifted.ev.off(
"messages.upsert",
handler
);



}catch(error){


console.log(error);


await react("❌");


reply(
"Download imeshindikana.",
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



}catch(error){


console.log(error);


await react("❌");


reply(
"Server error jaribu tena."
);


}

gmd(
    {
        pattern: "ytmp3",
        category: "downloader",
        react: "🎵",
        aliases: ["ytaudio", "ytmusic"],
        description: "Download YouTube audio",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply(
                `*${botName} YOUTUBE AUDIO DOWNLOADER*\n\n`
                + "Tuma link ya YouTube\n\n"
                + "Example:\n.ytmp3 https://youtube.com/watch?v=xxxx"
            );
        }

        try {
            const apiUrl =
                `${GiftedTechApi}/api/download/ytmp3?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;

            const response = await axios.get(apiUrl, {
                timeout: 60000,
            });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("Imeshindikana kupata audio.");
            }

            const {
                title,
                download_url
            } = response.data.result;

            if (!download_url) {
                await react("❌");
                return reply("Download link haipo.");
            }

            await reply(
                `> *${botName}*\n\n`
                + `🎧 *Downloading:* ${title || "Unknown"}`
            );

            const audioBuffer = await gmdBuffer(download_url);
            const audio = await formatAudio(audioBuffer);

            await Gifted.sendMessage(
                from,
                {
                    audio: audio,
                    mimetype: "audio/mpeg",
                    fileName: `${title || "audio"}.mp3`,
                },
                {
                    quoted: mek,
                }
            );

            await react("✅");

        } catch (error) {
            console.log("YTMP3 ERROR:", error);
            await react("❌");
            reply("Error imetokea jaribu tena.");
        }
    },
);


gmd(
    {
        pattern: "ytmp4",
        category: "downloader",
        react: "🎬",
        aliases: ["ytvideo", "youtubevideo"],
        description: "Download YouTube video",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer,
            formatVideo,
            MAX_MEDIA_SIZE,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if (!q) {
            await react("❌");
            return reply(
                `*${botName} VIDEO DOWNLOADER*\n\n`
                +"Tuma YouTube link."
            );
        }


        try {

            const apiUrl =
            `${GiftedTechApi}/api/download/ytmp4?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const response = await axios.get(apiUrl,{
                timeout:60000
            });


            if(!response.data?.success){
                await react("❌");
                return reply("Video haijapatikana.");
            }


            const result=response.data.result;


            const videoBuffer =
            await gmdBuffer(result.download_url);


            if(videoBuffer.length > MAX_MEDIA_SIZE){

                await Gifted.sendMessage(
                    from,
                    {
                        document:videoBuffer,
                        fileName:
                        `${result.title || "video"}.mp4`,
                        mimetype:"video/mp4"
                    },
                    {
                        quoted:mek
                    }
                );

            }else{

                const video =
                await formatVideo(videoBuffer);


                await Gifted.sendMessage(
                    from,
                    {
                        video:video,
                        mimetype:"video/mp4",
                        caption:
                        `*${botName}*\n\n${result.title || ""}`
                    },
                    {
                        quoted:mek
                    }
                );
            }


            await react("✅");


        } catch(error){

            console.log(error);
            await react("❌");
            reply("Imeshindikana kupakua video.");

        }
    },
);
});gmd(
    {
        pattern: "tiktok",
        category: "downloader",
        react: "🎵",
        aliases: ["tt", "ttdl", "tiktokdl"],
        description: "Download TikTok video",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} TIKTOK DOWNLOADER*\n\n`
                +"Tuma TikTok link."
            );
        }


        try {

            const api =
            `${GiftedTechApi}/api/download/tiktok?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res = await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("TikTok video haijapatikana.");
            }


            const data=res.data.result;


            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:data.download_url
                    },
                    caption:
                    `*${botName} TIKTOK*\n\n`
                    +`${data.title || "TikTok Video"}`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(e){

            console.log(e);
            await react("❌");
            reply("Error wakati wa TikTok download.");

        }
    },
);



gmd(
    {
        pattern:"instagram",
        category:"downloader",
        react:"📸",
        aliases:["ig","igdl","insta"],
        description:"Download Instagram media",
    },
    async(from,Gifted,conText)=>{

        const{
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
                `*${botName} INSTAGRAM DOWNLOADER*\n\n`
                +"Tuma Instagram link."
            );
        }


        try{

            const api =
            `${GiftedTechApi}/api/download/instagram?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("Instagram media haijapatikana.");
            }


            const result=res.data.result;


            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:result.download_url
                    },
                    caption:
                    `*${botName} INSTAGRAM*\n\n`
                    +"Downloaded successfully"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Instagram download error.");

        }

    },
);



gmd(
    {
        pattern:"facebook",
        category:"downloader",
        react:"📘",
        aliases:["fb","fbdl"],
        description:"Download Facebook video",
    },
    async(from,Gifted,conText)=>{


        const{
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
                `*${botName} FACEBOOK DOWNLOADER*\n\n`
                +"Tuma Facebook video link."
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
                return reply("Facebook video haijapatikana.");

            }



            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:res.data.result.download_url
                    },
                    caption:
                    `*${botName} FACEBOOK*\n\n`
                    +"Downloaded"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("Facebook downloader error.");

        }


    },
);gmd(
    {
        pattern: "pinterest",
        category: "downloader",
        react: "📌",
        aliases: ["pin", "pindl"],
        description: "Download Pinterest images/videos",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if (!q) {
            await react("❌");
            return reply(
                `*${botName} PINTEREST DOWNLOADER*\n\nTuma Pinterest link`
            );
        }


        try {

            const api =
            `${GiftedTechApi}/api/download/pinterest?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res = await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("Pinterest file haijapatikana.");
            }


            const data=res.data.result;


            await Gifted.sendMessage(
                from,
                {
                    image:{
                        url:data.download_url
                    },
                    caption:
                    `*${botName} PINTEREST*\n\n`
                    +"Downloaded successfully"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Pinterest downloader error.");

        }

    },
);



gmd(
    {
        pattern:"twitter",
        category:"downloader",
        react:"🐦",
        aliases:["x","tw","xdl"],
        description:"Download Twitter/X video",
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
                `*${botName} X DOWNLOADER*\n\nTuma Twitter/X link`
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
                return reply("Video haijapatikana.");
            }


            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:res.data.result.download_url
                    },
                    caption:
                    `*${botName} X DOWNLOADER*\n\n`
                    +"Downloaded"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("X downloader error.");

        }

    },
);



gmd(
    {
        pattern:"soundcloud",
        category:"downloader",
        react:"🎶",
        aliases:["sc","scdl"],
        description:"Download SoundCloud music",
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
                `*${botName} SOUNDCLOUD*\n\nTuma SoundCloud link`
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
                return reply("Audio haijapatikana.");

            }



            const audio =
            await gmdBuffer(res.data.result.download_url);


            const formatted =
            await formatAudio(audio);



            await Gifted.sendMessage(
                from,
                {
                    audio:formatted,
                    mimetype:"audio/mpeg"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("SoundCloud error.");

        }

    },
);gmd(
    {
        pattern: "github",
        category: "downloader",
        react: "💻",
        aliases: ["git", "githubdl"],
        description: "Download GitHub files",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} GITHUB DOWNLOADER*\n\n`
                +"Tuma GitHub link"
            );
        }


        try{

            const api =
            `${GiftedTechApi}/api/download/github?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){

                await react("❌");
                return reply("GitHub file haijapatikana.");

            }


            const data=res.data.result;


            await Gifted.sendMessage(
                from,
                {
                    document:{
                        url:data.download_url
                    },
                    fileName:
                    data.fileName || "github_file.zip",
                    mimetype:
                    "application/zip"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("GitHub downloader error.");

        }

    },
);



gmd(
    {
        pattern:"media",
        category:"downloader",
        react:"📥",
        aliases:["urlmedia","url"],
        description:"Download direct media URL",
    },
    async(from,Gifted,conText)=>{

        const {
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer,
            getMimeFromUrl
        }=conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} MEDIA DOWNLOADER*\n\n`
                +"Tuma direct link"
            );
        }



        try{


            const buffer =
            await gmdBuffer(q);


            const mime =
            getMimeFromUrl(q) ||
            "application/octet-stream";



            await Gifted.sendMessage(
                from,
                {
                    document:buffer,
                    fileName:"downloaded_file",
                    mimetype:mime
                },
                {
                    quoted:mek
                }
            );



            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Fail kupata file.");

        }


    },
);



gmd(
    {
        pattern:"apksearch",
        category:"downloader",
        react:"📱",
        aliases:["apkpro","appdl"],
        description:"Search and download APK",
    },
    async(from,Gifted,conText)=>{

        const{
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
                `*${botName} APK SEARCH*\n\n`
                +"Andika jina la app"
            );

        }



        try{


            const api =
            `${GiftedTechApi}/api/download/apkdl?apikey=${GiftedApiKey}&appName=${encodeURIComponent(q)}`;



            const res =
            await axios.get(api,{
                timeout:60000
            });



            if(!res.data?.success){

                await react("❌");
                return reply("App haijapatikana.");

            }



            const app=res.data.result;



            await Gifted.sendMessage(
                from,
                {
                    image:{
                        url:app.appicon
                    },
                    caption:
                    `*${botName} APK DOWNLOADER*\n\n`
                    +`📱 ${app.appname}\n`
                    +`👨‍💻 ${app.developer || "Unknown"}`
                },
                {
                    quoted:mek
                }
            );



            await Gifted.sendMessage(
                from,
                {
                    document:{
                        url:app.download_url
                    },
                    fileName:
                    `${app.appname}.apk`,
                    mimetype:
                    "application/vnd.android.package-archive"
                },
                {
                    quoted:mek
                }
            );



            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("APK download error.");

        }


    },
);gmd(
    {
        pattern: "ytsearch",
        category: "downloader",
        react: "🔎",
        aliases: ["yts", "youtube"],
        description: "Search YouTube videos",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} YOUTUBE SEARCH*\n\n`
                +"Andika jina la video"
            );
        }


        try {

            const api =
            `${GiftedTechApi}/api/search/yts?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:30000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("Hakuna matokeo.");
            }


            const videos =
            res.data.results.slice(0,5);


            let text =
            `*${botName} YOUTUBE SEARCH*\n\n`;


            videos.forEach((v,i)=>{
                text +=
                `${i+1}. ${v.title}\n`;
            });


            await Gifted.sendMessage(
                from,
                {
                    image:{
                        url:videos[0].thumbnail
                    },
                    caption:text+
                    `\n\nJibu namba kuchagua video`
                },
                {
                    quoted:mek
                }
            );


            const msgId =
            Date.now();


            const handler = async(event)=>{

                const m=event.messages[0];

                if(!m.message)return;


                const body =
                m.message.conversation ||
                m.message.extendedTextMessage?.text;


                if(!body)return;


                const num=parseInt(body);


                if(num>=1 && num<=5){

                    const video =
                    videos[num-1];


                    await react("⬇️");


                    await Gifted.sendMessage(
                        from,
                        {
                            text:
                            `⏳ Downloading...\n\n${video.title}`
                        },
                        {
                            quoted:m
                        }
                    );


                    Gifted.ev.off(
                        "messages.upsert",
                        handler
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



        }catch(error){

            console.log(error);
            await react("❌");
            reply("YouTube search error.");

        }

    },
);



gmd(
    {
        pattern:"imgdl",
        category:"downloader",
        react:"🖼️",
        aliases:["image","imagedl"],
        description:"Download image from URL",
    },
    async(from,Gifted,conText)=>{


        const{
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer
        }=conText;



        if(!q){
            await react("❌");
            return reply(
                `*${botName} IMAGE DOWNLOADER*\n\n`
                +"Tuma image URL"
            );
        }



        try{

            const image =
            await gmdBuffer(q);



            await Gifted.sendMessage(
                from,
                {
                    image:image,
                    caption:
                    `*${botName} IMAGE DOWNLOADER*`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("Image haijapakuliwa.");

        }

    },
);



gmd(
    {
        pattern:"gifdl",
        category:"downloader",
        react:"🎞️",
        aliases:["gif"],
        description:"Download GIF",
    },
    async(from,Gifted,conText)=>{

        const{
            q,
            mek,
            reply,
            react,
            botName
        }=conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} GIF DOWNLOADER*\n\n`
                +"Tuma GIF link"
            );
        }



        try{


            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:q
                    },
                    gifPlayback:true,
                    caption:
                    `*${botName} GIF*`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("GIF error.");

        }


    },
);gmd(
    {
        pattern: "tiktokmp3",
        category: "downloader",
        react: "🎧",
        aliases: ["ttmp3", "ttaudio"],
        description: "Download TikTok audio",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} TIKTOK MP3*\n\nTuma TikTok link`
            );
        }


        try{

            const api =
            `${GiftedTechApi}/api/download/tiktokmp3?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("Audio haijapatikana.");
            }


            const buffer =
            await gmdBuffer(res.data.result.download_url);


            const audio =
            await formatAudio(buffer);



            await Gifted.sendMessage(
                from,
                {
                    audio:audio,
                    mimetype:"audio/mpeg"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("TikTok MP3 error.");

        }

    },
);



gmd(
    {
        pattern:"statusdl",
        category:"downloader",
        react:"📲",
        aliases:["wastatus","status"],
        description:"Download WhatsApp status",
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
                `*${botName} STATUS DOWNLOADER*\n\n`
                +"Tuma status media link"
            );
        }



        try{

            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:q
                    },
                    caption:
                    `*${botName} STATUS DOWNLOADER*`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Status haijapatikana.");

        }

    },
);



gmd(
    {
        pattern:"convertmp3",
        category:"downloader",
        react:"🔄",
        aliases:["tomp3","audio"],
        description:"Convert video to mp3",
    },
    async(from,Gifted,conText)=>{


        const {
            q,
            mek,
            reply,
            react,
            botName,
            gmdBuffer,
            formatAudio
        }=conText;



        if(!q){
            await react("❌");
            return reply(
                `*${botName} MP3 CONVERTER*\n\n`
                +"Tuma video link"
            );
        }



        try{


            const video =
            await gmdBuffer(q);


            const audio =
            await formatAudio(video);



            await Gifted.sendMessage(
                from,
                {
                    audio:audio,
                    mimetype:"audio/mpeg"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("Converter error.");

        }

    },
);gmd(
    {
        pattern: "telegram",
        category: "downloader",
        react: "✈️",
        aliases: ["tg", "tgdl"],
        description: "Download Telegram media",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} TELEGRAM DOWNLOADER*\n\nTuma Telegram link`
            );
        }


        try{

            const api =
            `${GiftedTechApi}/api/download/telegram?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:60000
            });


            if(!res.data?.success){
                await react("❌");
                return reply("Telegram media haijapatikana.");
            }


            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:res.data.result.download_url
                    },
                    caption:
                    `*${botName} TELEGRAM DOWNLOADER*`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Telegram downloader error.");

        }

    },
);



gmd(
    {
        pattern:"reddit",
        category:"downloader",
        react:"👽",
        aliases:["reddl"],
        description:"Download Reddit media",
    },
    async(from,Gifted,conText)=>{

        const{
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
                `*${botName} REDDIT DOWNLOADER*\n\nTuma Reddit link`
            );
        }


        try{


            const api =
            `${GiftedTechApi}/api/download/reddit?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:60000
            });



            if(!res.data?.success){

                await react("❌");
                return reply("Reddit file haipo.");

            }



            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:res.data.result.download_url
                    },
                    caption:
                    `*${botName} REDDIT*`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("Reddit error.");

        }

    },
);



gmd(
    {
        pattern:"snapchat",
        category:"downloader",
        react:"👻",
        aliases:["snap","snapdl"],
        description:"Download Snapchat videos",
    },
    async(from,Gifted,conText)=>{


        const{
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
                `*${botName} SNAPCHAT DOWNLOADER*\n\nTuma Snapchat link`
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
                return reply("Snapchat video haijapatikana.");
            }



            await Gifted.sendMessage(
                from,
                {
                    video:{
                        url:res.data.result.download_url
                    },
                    caption:
                    `*${botName} SNAPCHAT*`
                },
                {
                    quoted:mek
                }
            );



            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("Snapchat downloader error.");

        }

    },
);gmd(
    {
        pattern: "urlcheck",
        category: "downloader",
        react: "🔍",
        aliases: ["checkurl", "scanurl"],
        description: "Check media URL information",
    },
    async (from, Gifted, conText) => {

        const {
            q,
            mek,
            reply,
            react,
            botName,
        } = conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} URL SCANNER*\n\nTuma link`
            );
        }


        try{

            const response =
            await axios.head(q,{
                timeout:15000
            });


            const type =
            response.headers["content-type"] || "Unknown";


            const size =
            response.headers["content-length"] || "Unknown";


            await Gifted.sendMessage(
                from,
                {
                    text:
                    `*${botName} URL SCANNER*\n\n`
                    +`🔗 URL: ${q}\n`
                    +`📁 Type: ${type}\n`
                    +`📦 Size: ${size}`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Link haijasomeka.");

        }

    },
);



gmd(
    {
        pattern:"zip",
        category:"downloader",
        react:"🗜️",
        aliases:["zipdl"],
        description:"Download zip file",
    },
    async(from,Gifted,conText)=>{

        const{
            q,
            mek,
            reply,
            react,
            botName
        }=conText;


        if(!q){
            await react("❌");
            return reply(
                `*${botName} ZIP DOWNLOADER*\n\nTuma zip link`
            );
        }



        try{

            await Gifted.sendMessage(
                from,
                {
                    document:{
                        url:q
                    },
                    fileName:"MNYANDWA.zip",
                    mimetype:
                    "application/zip"
                },
                {
                    quoted:mek
                }
            );


            await react("✅");


        }catch(error){

            console.log(error);
            await react("❌");
            reply("Zip download error.");

        }

    },
);



gmd(
    {
        pattern:"apkinfo",
        category:"downloader",
        react:"📲",
        aliases:["appinfo"],
        description:"Get APK information",
    },
    async(from,Gifted,conText)=>{


        const{
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
                `*${botName} APK INFO*\n\nAndika jina la app`
            );
        }



        try{


            const api =
            `${GiftedTechApi}/api/search/apk?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;


            const res =
            await axios.get(api,{
                timeout:30000
            });



            if(!res.data?.success){
                await react("❌");
                return reply("App haijapatikana.");
            }



            const app=res.data.result;



            await Gifted.sendMessage(
                from,
                {
                    text:
                    `*${botName} APK INFO*\n\n`
                    +`📱 Name: ${app.name || q}\n`
                    +`👨‍💻 Developer: ${app.developer || "Unknown"}\n`
                    +`⭐ Rating: ${app.rating || "N/A"}`
                },
                {
                    quoted:mek
                }
            );


            await react("✅");



        }catch(error){

            console.log(error);
            await react("❌");
            reply("APK info error.");

        }


    },
);
