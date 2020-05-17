const dbData = require("better-sqlite3")("./db/userdata.db");
const discord = require('discord.js');
const fmp = require("financialmodelingprep");
const axios = require("axios");
const auth = require('../auth.json');
const plotly = require('plotly')(auth.usernameplot, auth.tokenplot);
const fs = require('fs');


function getUserData(userId, value = ["*"]){
    return dbData.prepare(`SELECT ${value} FROM data WHERE id = ?`).get(userId);
}


function getPrefixServer(serverId){
    let query = dbData.prepare('SELECT prefix FROM prefix WHERE id = ?').get(serverId);
    if (query !== undefined){
        return [query.prefix, true];
    }
    return ["sm!", false];
}


function setPrefixServer(serverId, prefix){
    if(!getPrefixServer(serverId)[1]){
        dbData.prepare("INSERT INTO prefix VALUES(?,?)").run(serverId, prefix);
    }
    else{
        dbData.prepare("UPDATE prefix SET prefix = ? WHERE id = ?").run(prefix, serverId);
    }
}


function isAccountCreated(userId, autoMessage = false, msg){
    let row = dbData.prepare("SELECT id FROM data WHERE id = ?").get(userId);
    let isCreated = (row !== undefined);

    if(!isCreated && autoMessage){
        msg.channel.send((userId === msg.author.id) ? "You don't have any account! Please create one by typing `sm!init`" : "This member doesn't have any account!");
    }
    return isCreated;
}


function getTradeList(msg, userId = msg.author.id, value = null){
    let list = getUserData(userId, "trades").trades;

    list = JSON.parse(list).trades;
    return (Number.isInteger(value)) ? list.find(elem => elem.id === value) : list;
}


function updateList(msg, status, edit = []){
    let list = getTradeList(msg);

    if(status === "del"){
        list = list.filter(elem => elem.id !== edit[0]);
    }

    else if(status === "add"){
        let i = 0;
        for(i; list.find(elem => elem.id === i); i++){}
        let elemToAdd = {
            id : i,
            symbol : edit[0],
            status : edit[1],
            volume : edit[2],
            haspaid: edit[3],
        };

        list.push(elemToAdd);
    }

    list = {trades : list};
    dbData.prepare("UPDATE data SET trades = ? WHERE id = ?").run(JSON.stringify(list), msg.author.id);
}


function createEmbedMessage(msg, color, title, content = [], desc = null, img = null){
    let fields = [];
    content.forEach(e => fields.push(e));

    let embed = new discord.MessageEmbed()
        .setColor(color)
        .setDescription(desc || "")
        .setAuthor(title || "")
        .addFields(fields)

    if(img) {
        return embed
            .attachFiles(`img/${img}`)
            .setImage(`attachment://${img}`);
    }

    return embed
}


async function getTradeInfo(list, msg){
    let arrSymb = [];
    let arrTrade = [];

    for (const elem of list) {arrSymb.push(elem.symbol)}
    let resp = await fmp.stock(arrSymb).quote();
    try{
        list.forEach(elem => {
                let market = resp.find(e => elem.symbol === e.symbol.toLowerCase())
                arrTrade.push(
                    {
                        id: elem.id,
                        name: market.name,
                        symbol: elem.symbol,
                        volume: elem.volume,
                        status: elem.status,
                        haspaid: parseFloat(elem.haspaid),
                        price: market.price,
                    }
                )
            }
        );
    }
    catch (e) {
        msg.channel.send("API Error! Please try later.\n```\n"+e+"\n```");
        console.error(e);
    }

    let arrResult = [];
    for(let m of arrTrade){
        let worthTrade = m.price * m.volume;
        let profit = worthTrade - m.haspaid;
        let shownWorthTrade = worthTrade;
        let shownProfit = profit;

        if (m.status === "sell") {
            profit *= -1;
            worthTrade = profit + m.haspaid;
        }

        let percentage = (profit / (m.price * m.volume)) * 100;

        arrResult.push(
            {
                name : m.name,
                symbol : m.symbol,
                status : m.status,
                id : m.id,
                volume : m.volume,
                haspaid : m.haspaid,
                worthTrade: worthTrade,
                profit : profit,
                profitPercentage : percentage,
                shownProfit : shownProfit,
                shownWorthTrade : shownWorthTrade
            }
        )
    }
    return arrResult;
}


function updateMoney(msg, userID, num){
    let money = getUserData(userID, "money").money;
    money = Math.max(0, money + num);
    dbData.prepare("UPDATE data SET money = ? WHERE id = ?").run(money, userID);
}


function setRightNumFormat(num, floatNum = true){
    return (Math.abs(num) <= 10 && num !== 0 && floatNum) ? num.toFixed(5) : parseFloat(num.toFixed(2)).toLocaleString();
}


function sendMsg(msg, sec, func, set, args = undefined){
    if(set.has(msg.author.id)) {
        msg.channel.send(`Please wait ${sec} seconds before using another command!`);
    }
    else {
        func(msg, args);
        set.add(msg.author.id);
        setTimeout(() => set.delete(msg.author.id), sec * 1000);
    }
}


function getChart(tag, limit, msg){
    return new Promise((resolve, reject) => {
        axios.get(`https://financialmodelingprep.com/api/v3/historical-chart/5min/${tag}`).then((arr) =>
        {
            let date = [];
            let close = [];
            let i = 0;
            try {
                for (const elem of arr.data) {
                    if (i >= limit) {
                        break;
                    }
                    date.push(elem.date);
                    close.push(elem.close);
                    i++;
                }
            } catch (TypeError) {
                console.log(`IMAGE NOT FOUND FOR ${tag} WITH ID ${msg.id}`)
            }

            let data = {
                "data": [{
                    x: date,
                    y: close,
                    type: "scatter",
                    mode: "lines+markers"
                }]
            };


            let opt = {
                format: 'png',
                width: '1000',
                height: '500'
            }

            plotly.getImage(data, opt, function (err, imageStream) {
                if (err) return console.log(err);
                let filestream = fs.createWriteStream(`img/${msg.id}.png`);
                imageStream.pipe(filestream);
                filestream.on('error', resolve); //Even if the promise failed, we want Promise.Race (in commands.js) to be resolved as fast as possible
                filestream.on('finish', resolve);
            })
        })
    });
}


function autoDelete(msg, path, check){
    if (check) {
        fs.unlink(path, function (err) {if (err) throw err;})
    }
}


function getUserId(msg, txt){
    txt = txt.split(" ")[1];

    if(txt && txt.substring(0, 3).concat(txt.substring(txt.length - 1, txt.length)) === "<@!>") {
        return txt.substring(3, txt.length - 1)
    }

    return msg.author.id;
}


module.exports = {
    getUserData : getUserData,
    isAccountCreated : isAccountCreated,
    getTradeList : getTradeList,
    updateList : updateList,
    createEmbedMessage : createEmbedMessage,
    getTradeInfo : getTradeInfo,
    setRightNumFormat : setRightNumFormat,
    updateMoney : updateMoney,
    sendMsg : sendMsg,
    getChart : getChart,
    getUserId : getUserId,
    getPrefixServer : getPrefixServer,
    setPrefixServer : setPrefixServer,
    autoDelete : autoDelete,
};