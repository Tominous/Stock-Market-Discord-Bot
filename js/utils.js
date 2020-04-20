const sql = require("better-sqlite3");
const dbData = sql("./db/userdata.db");
const fmp = require("financialmodelingprep");


function getUserData(userId, value = ["*"]){
    return dbData.prepare(`SELECT ${value} FROM data WHERE id = ?`).get(userId);
}


function isAccountCreated(userId, autoMessage = false, msg){
    let row = dbData.prepare("SELECT id FROM data WHERE id = ?").get(userId);
    let isCreated = (row !== undefined);

    if(!isCreated){
        if(autoMessage){
            let text = (userId === msg.author.id) ? "You don't have any account! Please create one by typing `sm!init`" : "This member doesn't have any account!";
            msg.channel.send(text);
        }
    }
    return isCreated;
}


function getTradeList(msg, value = null){
    let list = getUserData(msg.author.id, "trades").trades;

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


function createEmbedMessage(msg, color, title, content = [], desc = null){
    let embed = {
        embed : {
            color: color,
            description: desc,

            footer: {
                text: "Created by Cryx#6546"
            },

            author: {
                name: title
            },

            fields: []
        }
    };
    content.forEach(e => embed.embed.fields.push(e));
    return embed;
}


function prettyNum(num){
    return parseFloat(num.toFixed(2)).toLocaleString();
}

async function getTradeInfo(list, msg){
    let arrSymb = [];
    let arrTrade = [];

    for (const elem of list) {arrSymb.push(elem.symbol)}
    let resp = await fmp.stock(arrSymb).quote();
    list.forEach(elem => {
        try{
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
        catch (e) {
            msg.channel.send("API Error! Please try later.\n```\n"+e+"\n```");
            console.error(e);
        }
    });

    let arrResult = [];

    for(let m of arrTrade){
        let worthTrade = m.price * m.volume;
        let profit = worthTrade - m.haspaid;

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
                profitPercentage : percentage
            }
        )
    }
    return arrResult;
}


function updateMoney(msg, userID, num){
    let money = getUserData(userID, "money").money;

    money = (money + num < 0) ? 0 : (money + num);
    dbData.prepare("UPDATE data SET money = ? WHERE id = ?").run(money, userID);
}


function setRightNumFormat(num){
    return (Math.abs(num) <= 10 && num !== 0) ? num.toFixed(5) : prettyNum(num);
}

function sendMsg(msg, sec, func, set){
    if(set.has(msg.author.id)) {
        msg.channel.send(`Please wait ${sec} seconds before using another command!`);
    }
    else {
        func(msg);
        set.add(msg.author.id);
        setTimeout(() => set.delete(msg.author.id), sec * 1000);
    }
}


module.exports = {
    getUserData : getUserData,
    isAccountCreated : isAccountCreated,
    getTradeList : getTradeList,
    updateList : updateList,
    createEmbedMessage : createEmbedMessage,
    prettyNum : prettyNum,
    getTradeInfo : getTradeInfo,
    setRightNumFormat : setRightNumFormat,
    updateMoney : updateMoney,
    sendMsg : sendMsg
};