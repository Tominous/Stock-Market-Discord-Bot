const Discord = require("discord.js");
const auth = require('../auth.json');
const cmd = require ('./commands.js');
const util = require ('./utils.js');
const coolDownSet = new Set();
const client = new Discord.Client();

client.login(auth.token);

client.on("ready", () => {
    console.log(`Logged ! ${client.user.tag}`);
});


client.on("guildCreate", guild =>{
    let defChannel = "";
    Array.from(guild.channels.cache.values()).forEach((channel) => {

        if(channel.type === "text" && defChannel === ""){

            if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")){
                defChannel = channel;
                channel.send("Hey! To get started type `sm!help` !");
            }
        }
    });
});


client.on("message", msg => {
    let sMsg = msg.content.split(' ');

    try {
        if(msg.content.startsWith("sm!")){
            console.log(msg.content);
            msg.content = msg.content.toLowerCase();
            switch (sMsg[0]) {
                // Basics
                case "sm!init":
                    util.sendMsg(msg, 2, cmd.initializeUser, coolDownSet);
                    break;

                case "sm!help":
                    util.sendMsg(msg, 2, cmd.showHelp, coolDownSet);
                    break;

                // trades manipulation
                case "sm!newtrade":
                    util.sendMsg(msg, 2, cmd.newTrade, coolDownSet);
                    break;

                case "sm!closetrade":
                    util.sendMsg(msg, 2, cmd.closeTrade, coolDownSet);
                    break;

                case "sm!search":
                    util.sendMsg(msg, 2, cmd.searchMarket, coolDownSet);
                    break;

                case "sm!show":
                    util.sendMsg(msg, 2, cmd.showMarket, coolDownSet);
                    break;

                // Player info
                case "sm!balance":
                    util.sendMsg(msg, 2, cmd.showBalance, coolDownSet);
                    break;

                case "sm!list":
                    util.sendMsg(msg, 2, cmd.showList, coolDownSet);
                    break;

                case "sm!daily":
                    util.sendMsg(msg, 2, cmd.getDaily, coolDownSet);
                    break;
            }
        }
    }
    catch (e) {
        msg.channel.send("Something went terribly wrong! Please send the following text to Cryx#6546\n" +
            "```\n"+e+"\n```");
        console.error(e);
    }
});

