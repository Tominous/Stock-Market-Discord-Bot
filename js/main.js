const Discord = require("discord.js");
const auth = require('../auth.json');
const cmd = require ('./commands.js');

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
        if(msg.content.startsWith("sm!")) {
            msg.content = msg.content.toLowerCase();
            switch (sMsg[0]) {
                // Basics
                case "sm!init":
                    cmd.initializeUser(msg);
                    break;

                case "sm!help":
                    cmd.showHelp(msg);
                    break;

                // trades manipulation
                case "sm!newtrade":
                    cmd.newTrade(msg);
                    break;

                case "sm!closetrade":
                    cmd.closeTrade(msg);
                    break;

                case "sm!search":
                    cmd.searchMarket(msg);
                    break;

                case "sm!show":
                    cmd.showMarket(msg);
                    break;

                // Player info
                case "sm!balance":
                    cmd.showBalance(msg);
                    break;

                case "sm!list":
                    cmd.showList(msg)
                    break;

                case "sm!daily":
                    cmd.getDaily(msg);
                    break;
            }
        }
    }
    catch (e) {
        msg.channel.send("Something went terribly wrong! Please send the following text to Cryx#6546\n" +
            "```\n"+e+"\n```");
    }
});

