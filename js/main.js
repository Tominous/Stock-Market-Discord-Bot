const Discord = require("discord.js");
const auth = require('../auth.json');
const cmd = require ('./commands.js');
const util = require ('./utils.js');
const coolDownSet = new Set();
const coolDownDelay = 2;
const client = new Discord.Client();

client.login(auth.token);

client.on("ready", () => {
    console.log(`Logged ! ${client.user.tag}`);
});

client.on("guildCreate", guild => {
    try {
        let defChannel = "";
        Array.from(guild.channels.cache.values()).forEach((channel) => {
            if (channel.type === "text" && defChannel === "" && channel.permissionsFor(guild.me).has("SEND_MESSAGES") && channel.permissionsFor(guild.me).has("VIEW_CHANNEL")) {
                defChannel = channel;
                defChannel.send("Hey! To get started type `sm!help` !");
                console.log(`JOINED ${guild.id} - ${guild.name}`)
            }
        });
    }
    catch (e) {console.log(e);}
});


client.on("message", msg => {
    let sMsg = msg.content.split(' ');
    msg.content = msg.content.toLowerCase();

    const commandsList = {
        // Basics
        "sm!init": {func: cmd.initializeUser},
        "sm!help": {func: cmd.showHelp},
        "sm!ping": {func: cmd.showPing},
        "sm!about": {func: cmd.showAbout, args: client.guilds.cache.size},

        // Trades manipulation
        "sm!newtrade": {func: cmd.newTrade},
        "sm!closetrade": {func: cmd.closeTrade},
        "sm!search": {func: cmd.searchMarket},
        "sm!show": {func: cmd.showMarket},

        //Player info
        "sm!balance": {func: cmd.showBalance},
        "sm!list": {func: cmd.showList},
        "sm!daily": {func: cmd.getDaily}
    };

    if (msg.content.startsWith("sm!")) {
        try {
            console.log(`${msg.author.id} - ${msg.content}`);

            if(!commandsList[sMsg[0]]){
                return
            }

            const {func, args} = commandsList[sMsg[0]];
            util.sendMsg(msg, coolDownDelay, func, coolDownSet, args)
        }
        catch (e) {
            msg.channel.send("Something went terribly wrong! Please send the following text to Cryx#6546\n" +
                "```\n" + e + "\n```");
            console.log(e);
        }
    }
});
