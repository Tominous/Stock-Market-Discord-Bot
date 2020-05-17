const Discord = require("discord.js");
const auth = require('../auth.json');
const cmd = require ('./commands.js');
const util = require ('./utils.js');
const dbData = require("better-sqlite3")("./db/userdata.db");
const coolDownSet = new Set();
const coolDownDelay = 5;
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

client.on("guildDelete", guild => {
    if(util.getPrefixServer(guild.id)[1] ){
        dbData.prepare("DELETE FROM prefix WHERE id = ?").run(guild.id);
    }
    console.log(`LEFT ${guild.id} - ${guild.name}`);
});

client.on("message", msg => {
    let sMsg = msg.content.split(' ');
    msg.content = msg.content.toLowerCase();

    const prefix = (msg.guild !== null ) ? util.getPrefixServer(msg.guild.id)[0] : "sm!";
    const commandsList = {
        // Basics
        "init": {func: cmd.initializeUser},
        "help": {func: cmd.showHelp},
        "prefix": {func: cmd.setPrefix, args: sMsg[1]},
        "ping": {func: cmd.showPing},
        "about": {func: cmd.showAbout, args: client.guilds.cache.size},

        // Trades manipulation
        "newtrade": {func: cmd.newTrade},
        "closetrade": {func: cmd.closeTrade},
        "search": {func: cmd.searchMarket},
        "show": {func: cmd.showMarket},

        //Player info
        "balance": {func: cmd.showBalance},
        "list": {func: cmd.showList},
        "daily": {func: cmd.getDaily}
    };

    if (msg.content.startsWith(prefix)){
        try {
            console.log(`${msg.author.id} - ${msg.content}`);

            if(!commandsList[sMsg[0].split(prefix)[1]]){
                return
            }
            const {func, args} = commandsList[sMsg[0].split(prefix)[1]];
            util.sendMsg(msg, coolDownDelay, func, coolDownSet, args);
        }
        catch (e) {
            msg.channel.send("Something went terribly wrong! Please send the following text to Cryx#6546\n" +
                "```\n" + e + "\n```");
            console.log(e);
        }
    }

    if(msg.content === `<@!${client.user.id}> prefix`){
        msg.channel.send(`My prefix is **${prefix}**`)
    }
});
