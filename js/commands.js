const fmp = require("financialmodelingprep");
const sql = require("better-sqlite3");
const util = require("./utils.js");
const dbData = sql("./db/userdata.db");

// sm!init
function initializeUser(msg){

    if(util.isAccountCreated(msg.author.id)) {
        msg.channel.send("You have already initialized you're account!");
    }
    else {
        dbData.prepare("INSERT INTO data VALUES(?,?,?,?)").run(msg.author.id, 100000, '{"trades" : []}', 0);
        msg.channel.send("Your account has been created!");
        showHelp(msg);
    }
}

// sm!balance
function showBalance(msg){
    if(util.isAccountCreated(msg.author.id, true, msg)) {
        let arr = {
            name: "Amount",
            value: `You have now **$${util.prettyNum(util.getUserData(msg.author.id, "money").money)}**`
            };

        msg.channel.send(util.createEmbedMessage(msg, "008CFF", "Balance", [arr]));
    }
}

//sm!help
function showHelp(msg){
    msg.channel.send(util.createEmbedMessage(msg, "008CFF", "Help!",
        [
            {
                name: "*Basics*",
                value: "`help` You're here \n`init` The command to get started \n\n"
            },
            {
                name: "*Player account*",
                value: "`balance` To admire your wealth \n`list` Your current trades \n`daily` To get your daily reward\n\n"
            },
            {
                name: "*Stock Market* ",
                value: "`search <name/symbol>` To search stock markets\n`show <symbol>` To get details about a particular market\n`newtrade <buy/sell> <symbol> <price>` To trade stock on the market(ex: *sm!newtrade buy AAPL 5000*)\n==>`buy` if you think the stock will go up, \n==>`sell` if you think the stock will go down.\n`closetrade <ID>`(ex: *sm!closetrade 0*) Close a trade (the ID can be found with the `list` command). Give to you the value of your trade."
            },
            {
                name: "*Okay, how do I play?* ",
                value: "First, you are going to look for a market. Type `sm!search <name/symbol>` (ex: *sm!search Apple or sm!search AAPL*).\nThen type `sm!show <symbol>` (ex: *sm!show AAPL*) if you want more details about the stock.\nNow it's time to trade! Follow the instructions above for newtrade and closetrade!\nHappy trading!",
            }
        ]
    ));
}

//sm!search
async function searchMarket(msg){
    let tag = msg.content.split('sm!search ')[1];

    let response = await fmp.search(tag, 10);
    if(response === undefined || response.length <= 0){
        text = "Nothing was found, try to shorten the symbol or the name (as removing 'USD' from it if present) and try again.";
        msg.channel.send(text);
    }
    else{
        let arrText = [];
        let arrSymb = []

        for (const r of response) {arrSymb.push(r.symbol)}

        let resp = await fmp.stock(arrSymb).quote();
        for(const market of resp){
            let text = {
                name : `${market.name} (${market.symbol})`,
                value : `Price: **$${market.price}**  (Change: **${market.changesPercentage}%** | **$${market.change}**)\n \n`
            };
            arrText.push(text);

        }
        msg.channel.send(util.createEmbedMessage(msg, "008CFF", "Results", arrText));
    }
}

//sm!show
function showMarket(msg){
    let tag = msg.content.split(' ')[1];

        fmp.stock(tag).quote().then(resp => {
            try {
                resp = resp[0];
                msg.channel.send(util.createEmbedMessage(msg, "008CFF", "Details", [{
                    name: `Information for ${resp.name} (${resp.symbol}): `,
                    value : `Price: **$${resp.price}** (Change: **${resp.changesPercentage}%** => **$${resp.change}**) \n \nSome prices may be different due to sources or delays.\nIf prices do not fluctuate, markets are likely closed.`
                }], `See the chart [here](https://tradingview.com/chart/?symbol=${resp.symbol})`));
            }
            catch (e) {
                msg.channel.send("Nothing was found. Please try again with an another symbol.");
            }
        });
}


//sm!daily
function getDaily(msg){
    if(util.isAccountCreated(msg.author.id, true, msg)){
        let data = util.getUserData(msg.author.id, ["dailytime", "money"])
        let dateNow = Math.round(Date.now()/1000);
        let delay = parseInt(data.dailytime) - dateNow;

        if(delay < 0){
            let newBalance = data.money + 10000;
            let newDailyTime = dateNow + 86400;

            dbData.prepare("UPDATE data SET money = ?, dailytime = ? WHERE id = ?").run(newBalance, newDailyTime,  msg.author.id,);
            msg.channel.send(util.createEmbedMessage(msg, "56C114", "Your daily reward!", [{
                name : `You have received your daily reward!`,
                value: `Thank you for your fidelity, you have received $10,000!`
                }
            ]));
        }
        else{
            let h = "0" + parseInt(delay / 3600);
            let m = "0" + parseInt(delay % 3600 / 60);
            let s = "0" + parseInt(delay % 60);

            msg.channel.send(util.createEmbedMessage(msg, "FF0000", "Your daily reward!",
                [{
                    name : `Be patient !`,
                    value: `Please wait **${h.toString().substr(-2)}h${m.toString().substr(-2)}m${s.toString().substr(-2)}s** and try again.`
            }]));
        }
    }
}

//sm!list
async function showList(msg){
    if(util.isAccountCreated(msg.author.id, true, msg)) {
        let list = util.getTradeList(msg);
        let embedList = [];

        if (list.length <= 0) {
            msg.channel.send("You don't own any share!");
        } else {

            let tradeInfoList = await util.getTradeInfo(list, msg);
            for (const elem of tradeInfoList) {
                let arr = {
                    name: `${elem.status.toUpperCase()} - ${elem.name} - ${elem.symbol.toUpperCase()} (ID: ${elem.id})`,
                    value: `Change: **${util.setRightNumFormat(elem.profitPercentage)}%**\n__By share__: Paid: **$${util.setRightNumFormat(elem.haspaid/elem.volume)}**, Now: **$${util.setRightNumFormat(elem.shownWorthTrade/elem.volume)}** (Profit: **$${(util.setRightNumFormat((elem.profit/elem.volume)))}**)\n__Your trade__: Paid: **$${util.setRightNumFormat(elem.haspaid)}**, Now: **$${util.setRightNumFormat(elem.shownWorthTrade)}** (Profit: **$${util.setRightNumFormat(elem.profit)}**)\n`
                };
                embedList.push(arr);
            }
            msg.channel.send(util.createEmbedMessage(msg, "008CFF", "Your trades", embedList));
        }
    }
}

//sm!closetrade
async function closeTrade(msg){
    if(util.isAccountCreated(msg.author.id, true, msg)){
        let id = parseInt(msg.content.split(" ")[1]);

        if(util.getTradeList(msg, id) === undefined || isNaN(id)){
            msg.channel.send(`You don't have any trade with ID: **${id}** \nType sm!list to see your trades and IDs`);
        }

        else{
            let trade =  util.getTradeList(msg, id);
            trade = await util.getTradeInfo([trade], msg);

            util.updateMoney(msg, msg.author.id, trade[0].worthTrade);

            let earnedLost = (trade[0].profit > 0) ? ["earned", "56C114"] : ["lost", "FF0000"];
            msg.channel.send(util.createEmbedMessage(msg, earnedLost[1],"Trade closed",
                [{
                name: `Trade n°**${id}** closed.`,
                value: `You have earned **$${util.setRightNumFormat(trade[0].worthTrade)}**`
            }]));

            showBalance(msg);

            util.updateList(msg, "del" , [id]);
        }
    }
}

//sm!newtrade
async function newTrade(msg){
    if(util.isAccountCreated(msg.author.id, true, msg)) {
        let status = msg.content.split(" ")[1];
        let symb = msg.content.split(" ")[2];
        let amount = msg.content.split(" ")[3];
        let resp = await fmp.stock(symb).quote();
        let list = util.getTradeList(msg);

        if(resp[0] === undefined){
            msg.channel.send("Unknown market! Please search one with `sm!search <name/symbol>` (ex: *sm!search Apple* or *sm!search AAPL*)");
        }
        else if((status !== "buy" && status !== "sell") || isNaN(amount) || amount < 0){
            msg.channel.send("Syntax error! Please try again. `sm!newtrade <symbol> <buy/sell> <amount>`");
        }

        else{
            let money = util.getUserData(msg.author.id, "money").money;
            if( money - amount >= 0) {
                if(list.length >= 15) {
                    msg.channel.send(util.createEmbedMessage(msg, "FF0000", "Payement refused!",
                        [{
                            name: `List full!`,
                            value: `You have too many shares! (Max:15)`
                        }]));
                }

                else {
                    let vol = amount / resp[0].price;
                    util.updateList(msg, "add", [symb, status, vol, amount]);
                    dbData.prepare("UPDATE data SET money = ? WHERE id = ?").run(money - amount, msg.author.id);

                    msg.channel.send(util.createEmbedMessage(msg, "56C114", "Payement accepted!",
                        [{
                            name: `${resp[0].name} - ${symb.toUpperCase()}`,
                            value: `You now own **${vol}** shares from this stock! (Type: ${status.toUpperCase()})`
                        }]));
                }
            }

            else{
                msg.channel.send(util.createEmbedMessage(msg, "FF0000", "Payement refused!",
                    [{
                        name: `${resp[0].name} - ${symb.toUpperCase()}`,
                        value: `You don't have enough money!`
                }]));
            }
        }
    }
}

module.exports = {
    searchMarket : searchMarket,
    initializeUser : initializeUser,
    showBalance : showBalance,
    getDaily : getDaily,
    showMarket : showMarket,
    showList : showList,
    closeTrade : closeTrade,
    newTrade : newTrade,
    showHelp : showHelp
};